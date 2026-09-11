import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { DELIVERY_TOPIC } from '../kafka/kafka.config.js';
import { MAX_DELIVERY_ATTEMPTS } from './delivery-policy.js';

@Injectable()
export class RetrySchedulerService {
  private readonly logger = new Logger(RetrySchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('*/5 * * * * *', { waitForCompletion: true })
  async publishDueRetries() {
    const dueDeliveries = await this.prisma.delivery.findMany({
      where: {
        status: 'RETRY_SCHEDULED',
        attemptCount: { lt: MAX_DELIVERY_ATTEMPTS },
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
      try {
        const queued = await this.prisma.$transaction(async (tx) => {
          // Claim this due retry.
          const claim = await tx.delivery.updateMany({
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

          if (claim.count === 0) {
            return false;
          }

          // Save the publishing instruction in the same transaction.
          await tx.outboxEvent.create({
            data: {
              deliveryId: delivery.id,
              topic: DELIVERY_TOPIC,
              payload: {
                deliveryId: delivery.id,
              },
            },
          });

          return true;
        });

        if (queued) {
          this.logger.log(
            `Queued retry for delivery ${delivery.id} in outbox`,
          );
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : String(error);

        this.logger.error(
          `Could not queue retry ${delivery.id}: ${message}`,
        );
      }
    }
  }
}