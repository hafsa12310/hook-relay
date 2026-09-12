import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { KafkaProducerService } from '../kafka/kafka-producer.service.js';

@Injectable()
export class OutboxPublisherService {
  private readonly logger = new Logger(OutboxPublisherService.name);

  // A claimed entry becomes eligible again after one minute.
  private readonly claimDurationMs = 60_000;

  // After a publishing error, retry after five seconds.
  private readonly retryDelayMs = 5_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  @Cron('* * * * * *', { waitForCompletion: true })
  async publishPendingEvents() {
    const events = await this.prisma.outboxEvent.findMany({
      where: {
        publishedAt: null,
        nextAttemptAt: { lte: new Date() },
      },
      orderBy: [
        { nextAttemptAt: 'asc' },
        { createdAt: 'asc' },
      ],
      take: 20,
    });

    for (const event of events) {
      const publicationAttempt = event.attemptCount + 1;

      // Claim only if the entry still matches what we read.
      const claim = await this.prisma.outboxEvent.updateMany({
        where: {
          id: event.id,
          publishedAt: null,
          attemptCount: event.attemptCount,
          nextAttemptAt: { lte: new Date() },
        },
        data: {
          attemptCount: { increment: 1 },
          nextAttemptAt: new Date(
            Date.now() + this.claimDurationMs,
          ),
        },
      });

      if (claim.count === 0) {
        continue;
      }

      try {
        await this.kafkaProducer.publishOutboxEvent(
          event.topic,
          event.deliveryId,
          event.payload,
        );

        // Record success only if this is still our claim.
        const marked = await this.prisma.outboxEvent.updateMany({
          where: {
            id: event.id,
            publishedAt: null,
            attemptCount: publicationAttempt,
          },
          data: {
            publishedAt: new Date(),
            lastError: null,
          },
        });

        if (marked.count > 0) {
          this.logger.log(
            `Published outbox event ${event.id} ` +
              `for delivery ${event.deliveryId}`,
          );
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : String(error);

        // Keep the entry available for another publishing attempt.
        await this.prisma.outboxEvent.updateMany({
          where: {
            id: event.id,
            publishedAt: null,
            attemptCount: publicationAttempt,
          },
          data: {
            lastError: message.slice(0, 2000),
            nextAttemptAt: new Date(
              Date.now() + this.retryDelayMs,
            ),
          },
        });

        this.logger.warn(
          `Outbox event ${event.id} will retry: ${message}`,
        );
      }
    }
  }
}