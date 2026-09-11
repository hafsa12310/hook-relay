var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DeliveryRecoveryService_1;
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { DELIVERY_TOPIC } from '../kafka/kafka.config.js';
import { MAX_DELIVERY_ATTEMPTS } from './delivery-policy.js';
let DeliveryRecoveryService = DeliveryRecoveryService_1 = class DeliveryRecoveryService {
    prisma;
    logger = new Logger(DeliveryRecoveryService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recoverExpiredDeliveries() {
        const expiredDeliveries = await this.prisma.delivery.findMany({
            where: {
                status: 'PROCESSING',
                OR: [
                    {
                        processingExpiresAt: { lte: new Date() },
                    },
                    {
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
                const outcome = await this.prisma.$transaction(async (tx) => {
                    const exhausted = delivery.attemptCount >= MAX_DELIVERY_ATTEMPTS;
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
                });
                if (outcome === 'QUEUED') {
                    this.logger.warn(`Recovered delivery ${delivery.id}; queued in outbox`);
                }
                if (outcome === 'DEAD') {
                    this.logger.warn(`Delivery ${delivery.id} exhausted its attempt limit ` +
                        'after a processing lease expired');
                }
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                this.logger.error(`Could not recover delivery ${delivery.id}: ${message}`);
            }
        }
    }
};
__decorate([
    Cron('*/5 * * * * *', { waitForCompletion: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeliveryRecoveryService.prototype, "recoverExpiredDeliveries", null);
DeliveryRecoveryService = DeliveryRecoveryService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], DeliveryRecoveryService);
export { DeliveryRecoveryService };
//# sourceMappingURL=delivery-recovery.service.js.map