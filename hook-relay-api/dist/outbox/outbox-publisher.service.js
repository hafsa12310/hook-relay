var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OutboxPublisherService_1;
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { KafkaProducerService } from '../kafka/kafka-producer.service.js';
let OutboxPublisherService = OutboxPublisherService_1 = class OutboxPublisherService {
    prisma;
    kafkaProducer;
    logger = new Logger(OutboxPublisherService_1.name);
    claimDurationMs = 60_000;
    retryDelayMs = 5_000;
    constructor(prisma, kafkaProducer) {
        this.prisma = prisma;
        this.kafkaProducer = kafkaProducer;
    }
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
            const claim = await this.prisma.outboxEvent.updateMany({
                where: {
                    id: event.id,
                    publishedAt: null,
                    attemptCount: event.attemptCount,
                    nextAttemptAt: { lte: new Date() },
                },
                data: {
                    attemptCount: { increment: 1 },
                    nextAttemptAt: new Date(Date.now() + this.claimDurationMs),
                },
            });
            if (claim.count === 0) {
                continue;
            }
            try {
                await this.kafkaProducer.publishOutboxEvent(event.topic, event.deliveryId, event.payload);
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
                    this.logger.log(`Published outbox event ${event.id} ` +
                        `for delivery ${event.deliveryId}`);
                }
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                await this.prisma.outboxEvent.updateMany({
                    where: {
                        id: event.id,
                        publishedAt: null,
                        attemptCount: publicationAttempt,
                    },
                    data: {
                        lastError: message.slice(0, 2000),
                        nextAttemptAt: new Date(Date.now() + this.retryDelayMs),
                    },
                });
                this.logger.warn(`Outbox event ${event.id} will retry: ${message}`);
            }
        }
    }
};
__decorate([
    Cron('* * * * * *', { waitForCompletion: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OutboxPublisherService.prototype, "publishPendingEvents", null);
OutboxPublisherService = OutboxPublisherService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        KafkaProducerService])
], OutboxPublisherService);
export { OutboxPublisherService };
//# sourceMappingURL=outbox-publisher.service.js.map