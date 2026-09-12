import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { DELIVERY_TOPIC } from '../kafka/kafka.config.js';
import { MAX_DELIVERY_ATTEMPTS } from './delivery-policy.js';

@Injectable()
export class RetrySchedulerService {
  private readonly logger = new Logger(RetrySchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('* * * * * *', { waitForCompletion: true })
  async publishDueRetries() {
    const dueDeliveries = await this.prisma.delivery.findMany({
      where: {
        status: {
          in: ['RETRY_SCHEDULED', 'WAITING'],
        },
        attemptCount: { lt: MAX_DELIVERY_ATTEMPTS },
        nextAttemptAt: { lte: new Date() },
      },
      orderBy: { nextAttemptAt: 'asc' },
      take: 100,
      select: {
        id: true,
        status: true,
        attemptCount: true,
      },
    });

    for (const delivery of dueDeliveries) {
      try {
        const queued = await this.prisma.$transaction(async (tx) => {
          const claim = await tx.delivery.updateMany({
            where: {
              id: delivery.id,
              status: delivery.status,
              attemptCount: delivery.attemptCount,
              nextAttemptAt: { lte: new Date() },
            },
            data: {
              status: 'PENDING',
              nextAttemptAt: null,
              waitReason: null,
            },
          });

          if (claim.count === 0) {
            return false;
          }

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
            `Queued due delivery ${delivery.id} in outbox`,
          );
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : String(error);

        this.logger.error(
          `Could not queue delivery ${delivery.id}: ${message}`,
        );
      }
    }
  }
}