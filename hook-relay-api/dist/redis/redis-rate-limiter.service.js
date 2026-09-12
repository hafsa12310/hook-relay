var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RedisRateLimiterService_1;
import 'dotenv/config';
import { Injectable, Logger, } from '@nestjs/common';
import { createClient } from 'redis';
import { randomUUID } from 'node:crypto';
import { SLIDING_WINDOW_SCRIPT } from './sliding-window.script.js';
let RedisRateLimiterService = RedisRateLimiterService_1 = class RedisRateLimiterService {
    logger = new Logger(RedisRateLimiterService_1.name);
    limit = this.readPositiveInteger('WEBHOOK_RATE_LIMIT', 5);
    windowMs = this.readPositiveInteger('WEBHOOK_RATE_WINDOW_MS', 1000);
    client = createClient({
        url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
        disableOfflineQueue: true,
        commandsQueueMaxLength: 100,
        socket: {
            connectTimeout: 2000,
            reconnectStrategy: (retries) => Math.min(200 * (retries + 1), 2000),
        },
    });
    onModuleInit() {
        this.client.on('error', (error) => {
            this.logger.warn(`Redis connection error: ${error.message}`);
        });
        this.client.on('ready', () => {
            this.logger.log(`Redis ready: ${this.limit} permissions per ` +
                `${this.windowMs} ms per receiver`);
        });
        void this.client.connect().catch((error) => {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Redis connection failed: ${message}`);
        });
    }
    async tryAcquire(destinationUrl) {
        if (!this.client.isReady) {
            throw new Error('Redis is not ready');
        }
        const origin = new URL(destinationUrl).origin;
        const key = `hookrelay:rate:v1:${origin}`;
        const controller = new AbortController();
        let timer;
        try {
            const result = await Promise.race([
                this.client
                    .withCommandOptions({
                    abortSignal: controller.signal,
                })
                    .eval(SLIDING_WINDOW_SCRIPT, {
                    keys: [key],
                    arguments: [
                        String(this.limit),
                        String(this.windowMs),
                        randomUUID(),
                    ],
                }),
                new Promise((_, reject) => {
                    timer = setTimeout(() => {
                        reject(new Error('Redis rate-limit check timed out'));
                        controller.abort();
                    }, 1000);
                }),
            ]);
            if (!Array.isArray(result) ||
                result.length !== 2 ||
                (result[0] !== 0 && result[0] !== 1) ||
                typeof result[1] !== 'number' ||
                !Number.isFinite(result[1])) {
                throw new Error('Unexpected rate-limit response');
            }
            return {
                allowed: result[0] === 1,
                retryAfterMs: Math.max(0, result[1]),
            };
        }
        finally {
            if (timer !== undefined) {
                clearTimeout(timer);
            }
        }
    }
    onModuleDestroy() {
        if (this.client.isOpen) {
            this.client.destroy();
        }
    }
    readPositiveInteger(name, fallback) {
        const value = Number(process.env[name] ?? fallback);
        if (!Number.isSafeInteger(value) || value <= 0) {
            throw new Error(`${name} must be a positive integer`);
        }
        return value;
    }
};
RedisRateLimiterService = RedisRateLimiterService_1 = __decorate([
    Injectable()
], RedisRateLimiterService);
export { RedisRateLimiterService };
//# sourceMappingURL=redis-rate-limiter.service.js.map