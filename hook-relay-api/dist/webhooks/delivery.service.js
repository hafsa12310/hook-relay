var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DeliveryService_1;
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service.js';
let DeliveryService = DeliveryService_1 = class DeliveryService {
    httpService;
    prisma;
    logger = new Logger(DeliveryService_1.name);
    constructor(httpService, prisma) {
        this.httpService = httpService;
        this.prisma = prisma;
    }
    async deliver(deliveryId) {
        const delivery = await this.prisma.delivery.findUnique({
            where: { id: deliveryId },
        });
        if (!delivery) {
            throw new Error(`Delivery ${deliveryId} does not exist`);
        }
        if (delivery.status !== 'PENDING') {
            this.logger.log(`Skipping ${deliveryId}: status is ${delivery.status}`);
            return;
        }
        let destinationStatus;
        try {
            const response = await this.httpService.axiosRef.post(delivery.destinationUrl, delivery.payload, { timeout: 5000 });
            destinationStatus = response.status;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const responseStatus = axios.isAxiosError(error)
                ? (error.response?.status ?? null)
                : null;
            await this.prisma.delivery.update({
                where: { id: deliveryId },
                data: {
                    status: 'FAILED',
                    destinationStatus: responseStatus,
                    errorMessage,
                },
            });
            this.logger.warn(`Delivery ${deliveryId} failed: ${errorMessage}`);
            return;
        }
        await this.prisma.delivery.update({
            where: { id: deliveryId },
            data: {
                status: 'DELIVERED',
                destinationStatus,
                errorMessage: null,
            },
        });
        this.logger.log(`Delivery ${deliveryId} delivered`);
    }
};
DeliveryService = DeliveryService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [HttpService,
        PrismaService])
], DeliveryService);
export { DeliveryService };
//# sourceMappingURL=delivery.service.js.map