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
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { DELIVERY_TIMEOUT_MS, MAX_DELIVERY_ATTEMPTS, PROCESSING_LEASE_MS, RETRY_DELAYS_MS, } from './delivery-policy.js';
let DeliveryService = DeliveryService_1 = class DeliveryService {
    prisma;
    httpService;
    logger = new Logger(DeliveryService_1.name);
    constructor(prisma, httpService) {
        this.prisma = prisma;
        this.httpService = httpService;
    }
    async deliver(deliveryId) {
        const processingToken = randomUUID();
        const claim = await this.prisma.delivery.updateMany({
            where: {
                id: deliveryId,
                status: 'PENDING',
                attemptCount: { lt: MAX_DELIVERY_ATTEMPTS },
            },
            data: {
                status: 'PROCESSING',
                attemptCount: { increment: 1 },
                nextAttemptAt: null,
                processingToken,
                processingExpiresAt: new Date(Date.now() + PROCESSING_LEASE_MS),
            },
        });
        if (claim.count === 0) {
            return;
        }
        const delivery = await this.prisma.delivery.findFirst({
            where: {
                id: deliveryId,
                status: 'PROCESSING',
                processingToken,
                processingExpiresAt: { gt: new Date() },
            },
        });
        if (!delivery) {
            return;
        }
        this.logger.log(`Attempt ${delivery.attemptCount}/${MAX_DELIVERY_ATTEMPTS} ` +
            `for ${delivery.id}`);
        this.maybeCrashForDemo('after-claim', delivery);
        let destinationStatus;
        try {
            const response = await this.httpService.axiosRef.post(delivery.destinationUrl, delivery.payload, {
                timeout: DELIVERY_TIMEOUT_MS,
                signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
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
            const status = error.response?.status;
            const retryable = (!error.response && Boolean(error.request)) ||
                status === 408 ||
                status === 429 ||
                (status !== undefined && status >= 500 && status <= 599);
            const willRetry = retryable &&
                delivery.attemptCount < MAX_DELIVERY_ATTEMPTS;
            const retryAfter = status === 429 || status === 503
                ? error.response?.headers['retry-after']
                : undefined;
            const nextAttemptAt = willRetry
                ? this.buildNextAttemptAt(delivery.attemptCount, retryAfter)
                : null;
            const deliveryStatus = willRetry
                ? 'RETRY_SCHEDULED'
                : retryable
                    ? 'DEAD'
                    : 'FAILED';
            const saved = await this.finishAttempt(delivery.id, processingToken, {
                status: deliveryStatus,
                destinationStatus: status ?? null,
                errorMessage: error.message.slice(0, 2000),
                nextAttemptAt,
            });
            if (saved) {
                this.logger.warn(nextAttemptAt
                    ? `Delivery ${delivery.id} will retry after ` +
                        nextAttemptAt.toISOString()
                    : `Delivery ${delivery.id} finished as ${deliveryStatus}`);
            }
            return;
        }
        this.maybeCrashForDemo('after-receiver', delivery);
        const saved = await this.finishAttempt(delivery.id, processingToken, {
            status: 'DELIVERED',
            destinationStatus,
            errorMessage: null,
            nextAttemptAt: null,
        });
        if (saved) {
            this.logger.log(`Delivery ${delivery.id} succeeded on attempt ` +
                delivery.attemptCount);
        }
    }
    async finishAttempt(deliveryId, processingToken, data) {
        const result = await this.prisma.delivery.updateMany({
            where: {
                id: deliveryId,
                status: 'PROCESSING',
                processingToken,
                processingExpiresAt: { gt: new Date() },
            },
            data: {
                ...data,
                processingToken: null,
                processingExpiresAt: null,
            },
        });
        if (result.count === 0) {
            this.logger.warn(`Ignored result for ${deliveryId}: ` +
                'the processing lease expired or ownership changed');
        }
        return result.count === 1;
    }
    buildNextAttemptAt(attemptCount, retryAfter) {
        const now = Date.now();
        let delayMs = RETRY_DELAYS_MS[attemptCount - 1] ?? 120_000;
        if (typeof retryAfter === 'string' ||
            typeof retryAfter === 'number') {
            const value = String(retryAfter).trim();
            const seconds = Number(value);
            const requestedDelay = Number.isFinite(seconds)
                ? Math.max(0, seconds * 1000)
                : Date.parse(value) - now;
            if (Number.isFinite(requestedDelay)) {
                delayMs = Math.max(delayMs, requestedDelay);
            }
        }
        const jitterMs = Math.floor(Math.random() * 1000);
        return new Date(now + delayMs + jitterMs);
    }
    maybeCrashForDemo(point, delivery) {
        if (process.env.NODE_ENV !== 'production' &&
            process.env.HOOKRELAY_DEMO_CRASH === point &&
            delivery.eventType === 'demo.worker-crash' &&
            delivery.attemptCount === 1) {
            this.logger.error(`Demo crash at ${point} for delivery ${delivery.id}`);
            process.exit(1);
        }
    }
};
DeliveryService = DeliveryService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        HttpService])
], DeliveryService);
export { DeliveryService };
//# sourceMappingURL=delivery.service.js.map