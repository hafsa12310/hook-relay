import { Module } from '@nestjs/common';
import { RedisRateLimiterService } from './redis-rate-limiter.service.js';

@Module({
  providers: [RedisRateLimiterService],
  exports: [RedisRateLimiterService],
})
export class RedisModule {}