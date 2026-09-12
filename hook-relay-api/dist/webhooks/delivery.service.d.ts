import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisRateLimiterService } from '../redis/redis-rate-limiter.service.js';
export declare class DeliveryService {
    private readonly prisma;
    private readonly httpService;
    private readonly rateLimiter;
    private readonly logger;
    constructor(prisma: PrismaService, httpService: HttpService, rateLimiter: RedisRateLimiterService);
    deliver(deliveryId: string): Promise<void>;
    private finishAttempt;
    private buildNextAttemptAt;
    private maybeCrashForDemo;
    private deferDelivery;
}
