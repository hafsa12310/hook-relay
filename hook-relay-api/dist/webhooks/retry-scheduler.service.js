var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RetrySchedulerService_1;
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { DELIVERY_TOPIC } from '../kafka/kafka.config.js';
import { MAX_DELIVERY_ATTEMPTS } from './delivery-policy.js';
let RetrySchedulerService = RetrySchedulerService_1 = class RetrySchedulerService {
    prisma;
    logger = new Logger(RetrySchedulerService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
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
                    this.logger.log(`Queued retry for delivery ${delivery.id} in outbox`);
                }
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                this.logger.error(`Could not queue retry ${delivery.id}: ${message}`);
            }
        }
    }
};
__decorate([
    Cron('*/5 * * * * *', { waitForCompletion: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RetrySchedulerService.prototype, "publishDueRetries", null);
RetrySchedulerService = RetrySchedulerService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], RetrySchedulerService);
export { RetrySchedulerService };
//# sourceMappingURL=retry-scheduler.service.js.map