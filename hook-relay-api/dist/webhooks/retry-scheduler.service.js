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
import { KafkaProducerService } from '../kafka/kafka-producer.service.js';
let RetrySchedulerService = RetrySchedulerService_1 = class RetrySchedulerService {
    prisma;
    kafkaProducer;
    logger = new Logger(RetrySchedulerService_1.name);
    constructor(prisma, kafkaProducer) {
        this.prisma = prisma;
        this.kafkaProducer = kafkaProducer;
    }
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
            if (claim.count === 0)
                continue;
            try {
                await this.kafkaProducer.publishDelivery(delivery.id);
                this.logger.log(`Published retry for delivery ${delivery.id}`);
            }
            catch (error) {
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
                const message = error instanceof Error ? error.message : 'Unknown error';
                this.logger.error(`Could not publish retry ${delivery.id}: ${message}`);
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
    __metadata("design:paramtypes", [PrismaService,
        KafkaProducerService])
], RetrySchedulerService);
export { RetrySchedulerService };
//# sourceMappingURL=retry-scheduler.service.js.map