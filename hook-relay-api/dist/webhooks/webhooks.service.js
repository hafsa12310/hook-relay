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
import { BadRequestException, Injectable, Logger, NotFoundException, } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { DELIVERY_TOPIC } from '../kafka/kafka.config.js';
let WebhooksService = WebhooksService_1 = class WebhooksService {
    prisma;
    logger = new Logger(WebhooksService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async sendWebhook(body) {
        if (!body ||
            typeof body !== 'object' ||
            Array.isArray(body) ||
            typeof body.type !== 'string' ||
            body.type.trim().length === 0) {
            throw new BadRequestException('The webhook body must contain a non-empty type');
        }
        const eventType = body.type;
        const payload = body;
        const delivery = await this.prisma.$transaction(async (tx) => {
            const createdDelivery = await tx.delivery.create({
                data: {
                    eventType,
                    payload,
                    destinationUrl: 'http://localhost:4000/webhooks',
                    status: 'PENDING',
                },
            });
            await tx.outboxEvent.create({
                data: {
                    deliveryId: createdDelivery.id,
                    topic: DELIVERY_TOPIC,
                    payload: {
                        deliveryId: createdDelivery.id,
                    },
                },
            });
            return createdDelivery;
        });
        this.logger.log(`Delivery ${delivery.id} saved with an outbox event`);
        return {
            accepted: true,
            deliveryId: delivery.id,
            message: 'Delivery saved and queued for publishing',
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
    __metadata("design:paramtypes", [PrismaService])
], WebhooksService);
export { WebhooksService };
//# sourceMappingURL=webhooks.service.js.map