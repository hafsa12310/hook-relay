import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service.js';
import { DELIVERY_TOPIC } from '../kafka/kafka.config.js';
import { MAX_DELIVERY_ATTEMPTS } from './delivery-policy.js';

@Injectable()
export class DeliveryRecoveryService {
  private readonly logger = new Logger(
    DeliveryRecoveryService.name,
  );

  constructor(private readonly prisma: PrismaService) {}

  @Cron('*/5 * * * * *', { waitForCompletion: true })
  async recoverExpiredDeliveries() {
    const expiredDeliveries = await this.prisma.delivery.findMany({
      where: {
        status: 'PROCESSING',
        OR: [
          {
            processingExpiresAt: { lte: new Date() },
          },
          {
            // Handles old PROCESSING rows created before leases.
            processingExpiresAt: null,
          },
        ],
      },
      orderBy: { processingExpiresAt: 'asc' },
      take: 100,
      select: {
        id: true,
        attemptCount: true,
        processingToken: true,
        processingExpiresAt: true,
      },
    });

    for (const delivery of expiredDeliveries) {
      try {
        const outcome = await this.prisma.$transaction(
          async (tx) => {
            const exhausted =
              delivery.attemptCount >= MAX_DELIVERY_ATTEMPTS;

            // Change only the exact attempt we inspected.
            const recovered = await tx.delivery.updateMany({
              where: {
                id: delivery.id,
                status: 'PROCESSING',
                attemptCount: delivery.attemptCount,
                processingToken: delivery.processingToken,
                processingExpiresAt: delivery.processingExpiresAt,
              },
              data: {
                status: exhausted ? 'DEAD' : 'PENDING',
                processingToken: null,
                processingExpiresAt: null,
                nextAttemptAt: null,
                destinationStatus: null,
                errorMessage: exhausted
                  ? 'Processing lease expired after the final ' +
                    'allowed attempt; receiver outcome is unknown'
                  : 'Processing lease expired; queued for recovery',
              },
            });

            if (recovered.count === 0) {
              return 'SKIPPED';
            }

            if (exhausted) {
              return 'DEAD';
            }

            // Save the recovery message in the same transaction.
            await tx.outboxEvent.create({
              data: {
                deliveryId: delivery.id,
                topic: DELIVERY_TOPIC,
                payload: {
                  deliveryId: delivery.id,
                },
              },
            });

            return 'QUEUED';
          },
        );

        if (outcome === 'QUEUED') {
          this.logger.warn(
            `Recovered delivery ${delivery.id}; queued in outbox`,
          );
        }

        if (outcome === 'DEAD') {
          this.logger.warn(
            `Delivery ${delivery.id} exhausted its attempt limit ` +
              'after a processing lease expired',
          );
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : String(error);

        this.logger.error(
          `Could not recover delivery ${delivery.id}: ${message}`,
        );
      }
    }
  }
}