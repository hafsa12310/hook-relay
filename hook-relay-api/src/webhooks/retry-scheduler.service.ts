import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { KafkaProducerService } from '../kafka/kafka-producer.service.js';

@Injectable()
export class RetrySchedulerService {
  private readonly logger = new Logger(RetrySchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  @Cron('*/5 * * * * *', { waitForCompletion: true })
  async publishDueRetries() {
    const dueDeliveries = await this.prisma.delivery.findMany({
      where: {
        status: 'RETRY_SCHEDULED',
        nextAttemptAt: { lte: new Date() },
      },
      orderBy: { nextAttemptAt: 'asc' },
      take: 100,
      select: {
        id: true,
        attemptCount: true,
      },
    });

    for (const delivery of dueDeliveries) {
      // Claim this retry for publication.
      const claim = await this.prisma.delivery.updateMany({
        where: {
          id: delivery.id,
          status: 'RETRY_SCHEDULED',
          attemptCount: delivery.attemptCount,
          nextAttemptAt: { lte: new Date() },
        },
        data: {
          status: 'PENDING',
          nextAttemptAt: null,
        },
      });

      if (claim.count === 0) continue;

      try {
        await this.kafkaProducer.publishDelivery(delivery.id);

        this.logger.log(
          `Published retry for delivery ${delivery.id}`,
        );
      } catch (error: unknown) {
        // If publication fails, make it eligible again later.
        // Do not overwrite a delivery already taken by a worker.
        await this.prisma.delivery.updateMany({
          where: {
            id: delivery.id,
            status: 'PENDING',
            attemptCount: delivery.attemptCount,
          },
          data: {
            status: 'RETRY_SCHEDULED',
            nextAttemptAt: new Date(Date.now() + 5000),
          },
        });

        const message =
          error instanceof Error ? error.message : 'Unknown error';

        this.logger.error(
          `Could not publish retry ${delivery.id}: ${message}`,
        );
      }
    }
  }
}