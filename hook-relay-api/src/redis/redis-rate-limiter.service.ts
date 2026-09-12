import 'dotenv/config';

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createClient } from 'redis';
import { randomUUID } from 'node:crypto';

import { SLIDING_WINDOW_SCRIPT } from './sliding-window.script.js';

export type RateLimitDecision = {
  allowed: boolean;
  retryAfterMs: number;
};

@Injectable()
export class RedisRateLimiterService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(
    RedisRateLimiterService.name,
  );

  private readonly limit = this.readPositiveInteger(
    'WEBHOOK_RATE_LIMIT',
    5,
  );

  private readonly windowMs = this.readPositiveInteger(
    'WEBHOOK_RATE_WINDOW_MS',
    1000,
  );

  private readonly client = createClient({
    url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
    disableOfflineQueue: true,
    commandsQueueMaxLength: 100,
    socket: {
      connectTimeout: 2000,
      reconnectStrategy: (retries) =>
        Math.min(200 * (retries + 1), 2000),
    },
  });

  onModuleInit(): void {
    this.client.on('error', (error: Error) => {
      this.logger.warn(`Redis connection error: ${error.message}`);
    });

    this.client.on('ready', () => {
      this.logger.log(
        `Redis ready: ${this.limit} permissions per ` +
          `${this.windowMs} ms per receiver`,
      );
    });

    // Connect in the background. The worker can start while Redis
    // is unavailable; delivery processing will defer sending.
    void this.client.connect().catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : String(error);

      this.logger.error(`Redis connection failed: ${message}`);
    });
  }

  async tryAcquire(
    destinationUrl: string,
  ): Promise<RateLimitDecision> {
    if (!this.client.isReady) {
      throw new Error('Redis is not ready');
    }

    // Paths on the same origin share one allowance.
    const origin = new URL(destinationUrl).origin;
    const key = `hookrelay:rate:v1:${origin}`;

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
      const result: unknown = await Promise.race([
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

        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error('Redis rate-limit check timed out'));
            controller.abort();
          }, 1000);
        }),
      ]);

      if (
        !Array.isArray(result) ||
        result.length !== 2 ||
        (result[0] !== 0 && result[0] !== 1) ||
        typeof result[1] !== 'number' ||
        !Number.isFinite(result[1])
      ) {
        throw new Error('Unexpected rate-limit response');
      }

      return {
        allowed: result[0] === 1,
        retryAfterMs: Math.max(0, result[1]),
      };
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    }
  }

  onModuleDestroy(): void {
    if (this.client.isOpen) {
      this.client.destroy();
    }
  }

  private readPositiveInteger(
    name: string,
    fallback: number,
  ): number {
    const value = Number(process.env[name] ?? fallback);

    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`${name} must be a positive integer`);
    }

    return value;
  }
}