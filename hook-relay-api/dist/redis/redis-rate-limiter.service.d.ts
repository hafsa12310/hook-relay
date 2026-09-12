import 'dotenv/config';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
export type RateLimitDecision = {
    allowed: boolean;
    retryAfterMs: number;
};
export declare class RedisRateLimiterService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private readonly limit;
    private readonly windowMs;
    private readonly client;
    onModuleInit(): void;
    tryAcquire(destinationUrl: string): Promise<RateLimitDecision>;
    onModuleDestroy(): void;
    private readPositiveInteger;
}
