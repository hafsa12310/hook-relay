var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WebhooksService_1;
import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException, } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { KafkaProducerService } from '../kafka/kafka-producer.service.js';
let WebhooksService = WebhooksService_1 = class WebhooksService {
    prisma;
    kafkaProducer;
    logger = new Logger(WebhooksService_1.name);
    constructor(prisma, kafkaProducer) {
        this.prisma = prisma;
        this.kafkaProducer = kafkaProducer;
    }
    async sendWebhook(body) {
        if (!body ||
            typeof body !== 'object' ||
            Array.isArray(body) ||
            typeof body.type !== 'string' ||
            body.type.trim() === '') {
            throw new BadRequestException('The request must contain a non-empty type');
        }
        const delivery = await this.prisma.delivery.create({
            data: {
                eventType: body.type,
                payload: body,
                destinationUrl: 'http://localhost:4000/webhooks',
                status: 'PENDING',
            },
        });
        try {
            await this.kafkaProducer.publishDelivery(delivery.id);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Kafka publication failed: ${message}`);
            throw new ServiceUnavailableException({
                accepted: false,
                deliveryId: delivery.id,
                message: 'Delivery was saved, but Kafka publication was not confirmed',
            });
        }
        return {
            accepted: true,
            deliveryId: delivery.id,
            message: 'Delivery accepted for background processing',
        };
    }
    async getDelivery(id) {
        const delivery = await this.prisma.delivery.findUnique({
            where: { id },
        });
        if (!delivery) {
            throw new NotFoundException('Delivery not found');
        }
        return delivery;
    }
};
WebhooksService = WebhooksService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        KafkaProducerService])
], WebhooksService);
export { WebhooksService };
//# sourceMappingURL=webhooks.service.js.map