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
const MAX_ATTEMPTS = 5;
const RETRY_DELAYS_MS = [10_000, 30_000, 60_000, 120_000];
let DeliveryService = DeliveryService_1 = class DeliveryService {
    httpService;
    prisma;
    logger = new Logger(DeliveryService_1.name);
    constructor(httpService, prisma) {
        this.httpService = httpService;
        this.prisma = prisma;
    }
    async deliver(deliveryId) {
        const claim = await this.prisma.delivery.updateMany({
            where: {
                id: deliveryId,
                status: 'PENDING',
                attemptCount: { lt: MAX_ATTEMPTS },
            },
            data: {
                status: 'PROCESSING',
                attemptCount: { increment: 1 },
                nextAttemptAt: null,
            },
        });
        if (claim.count === 0) {
            this.logger.log(`Skipping ${deliveryId}: not pending or already claimed`);
            return;
        }
        const delivery = await this.prisma.delivery.findUniqueOrThrow({
            where: { id: deliveryId },
        });
        this.logger.log(`Attempt ${delivery.attemptCount}/${MAX_ATTEMPTS} ` +
            `for ${deliveryId}`);
        let destinationStatus;
        try {
            const response = await this.httpService.axiosRef.post(delivery.destinationUrl, delivery.payload, {
                timeout: 5000,
                maxRedirects: 0,
                headers: {
                    'X-HookRelay-Delivery-ID': delivery.id,
                    'X-HookRelay-Attempt': String(delivery.attemptCount),
                },
            });
            destinationStatus = response.status;
        }
        catch (error) {
            if (!axios.isAxiosError(error)) {
                throw error;
            }
            const status = error.response?.status ?? null;
            const networkFailure = !error.response && Boolean(error.request);
            const retryable = networkFailure ||
                status === 408 ||
                status === 429 ||
                (status !== null && status >= 500 && status <= 599);
            if (retryable && delivery.attemptCount < MAX_ATTEMPTS) {
                const baseDelay = RETRY_DELAYS_MS[delivery.attemptCount - 1] ?? 120_000;
                const retryAfter = status === 429 || status === 503
                    ? this.parseRetryAfter(error.response?.headers['retry-after'])
                    : 0;
                const jitter = Math.floor(Math.random() * 1000);
                const delayMs = Math.max(baseDelay, retryAfter) + jitter;
                const nextAttemptAt = new Date(Date.now() + delayMs);
                await this.prisma.delivery.update({
                    where: { id: delivery.id },
                    data: {
                        status: 'RETRY_SCHEDULED',
                        destinationStatus: status,
                        errorMessage: error.message,
                        nextAttemptAt,
                    },
                });
                this.logger.warn(`Delivery ${delivery.id} will retry after ` +
                    nextAttemptAt.toISOString());
                return;
            }
            await this.prisma.delivery.update({
                where: { id: delivery.id },
                data: {
                    status: retryable ? 'DEAD' : 'FAILED',
                    destinationStatus: status,
                    errorMessage: error.message,
                    nextAttemptAt: null,
                },
            });
            this.logger.warn(`Delivery ${delivery.id} stopped: ` +
                `${retryable ? 'DEAD' : 'FAILED'}`);
            return;
        }
        await this.prisma.delivery.update({
            where: { id: delivery.id },
            data: {
                status: 'DELIVERED',
                destinationStatus,
                errorMessage: null,
                nextAttemptAt: null,
            },
        });
        this.logger.log(`Delivery ${delivery.id} succeeded on attempt ` +
            delivery.attemptCount);
    }
    parseRetryAfter(value) {
        if (typeof value !== 'string' && typeof value !== 'number') {
            return 0;
        }
        const text = String(value).trim();
        if (!text)
            return 0;
        const seconds = Number(text);
        if (Number.isFinite(seconds) && seconds >= 0) {
            return seconds * 1000;
        }
        const date = Date.parse(text);
        return Number.isNaN(date)
            ? 0
            : Math.max(0, date - Date.now());
    }
};
DeliveryService = DeliveryService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [HttpService,
        PrismaService])
], DeliveryService);
export { DeliveryService };
//# sourceMappingURL=delivery.service.js.map