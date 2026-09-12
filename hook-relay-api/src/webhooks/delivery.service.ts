import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service.js';
import type {
  Delivery,
  Prisma,
} from '../generated/prisma/client.js';
import {
  RedisRateLimiterService,
  type RateLimitDecision,
} from '../redis/redis-rate-limiter.service.js';

import {
  DELIVERY_TIMEOUT_MS,
  MAX_DELIVERY_ATTEMPTS,
  PROCESSING_LEASE_MS,
  RETRY_DELAYS_MS,
} from './delivery-policy.js';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly rateLimiter: RedisRateLimiterService,  
  ) {}

  async deliver(deliveryId: string) {
    const candidate = await this.prisma.delivery.findFirst({
    where: {
      id: deliveryId,
      status: 'PENDING',
      attemptCount: { lt: MAX_DELIVERY_ATTEMPTS },
    },
    select: {
      id: true,
      destinationUrl: true,
      attemptCount: true,
    },
  });

  if (!candidate) {
    return;
  }

  let decision: RateLimitDecision;

  try {
    decision = await this.rateLimiter.tryAcquire(
      candidate.destinationUrl,
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);

    this.logger.warn(`Rate-limit check failed: ${message}`);

    await this.deferDelivery(
      candidate.id,
      candidate.attemptCount,
      5000,
      'REDIS_UNAVAILABLE',
    );

    return;
  }

  if (!decision.allowed) {
    await this.deferDelivery(
      candidate.id,
      candidate.attemptCount,
      decision.retryAfterMs + 50,
      'RATE_LIMIT',
    );

    return;
  }

  const processingToken = randomUUID();

  const claim = await this.prisma.delivery.updateMany({
    where: {
      id: deliveryId,
      status: 'PENDING',
      attemptCount: candidate.attemptCount,
    },
    data: {
      status: 'PROCESSING',
      attemptCount: { increment: 1 },
      nextAttemptAt: null,
      waitReason: null,
      processingToken,
      processingExpiresAt: new Date(
        Date.now() + PROCESSING_LEASE_MS,
      ),
    },
  });

    if (claim.count === 0) {
      return;
    }

    // Check that we still own a valid lease before proceeding.
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

    this.logger.log(
      `Attempt ${delivery.attemptCount}/${MAX_DELIVERY_ATTEMPTS} ` +
        `for ${delivery.id}`,
    );

    this.maybeCrashForDemo('after-claim', delivery);

    let destinationStatus: number;

    try {
      const response = await this.httpService.axiosRef.post(
        delivery.destinationUrl,
        delivery.payload,
        {
          timeout: DELIVERY_TIMEOUT_MS,
          signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
          maxRedirects: 0,
          headers: {
            'X-HookRelay-Delivery-ID': delivery.id,
            'X-HookRelay-Attempt': String(delivery.attemptCount),
          },
        },
      );

      destinationStatus = response.status;
    } catch (error: unknown) {
      if (!axios.isAxiosError(error)) {
        throw error;
      }

      const status = error.response?.status;

      const retryable =
        (!error.response && Boolean(error.request)) ||
        status === 408 ||
        status === 429 ||
        (status !== undefined && status >= 500 && status <= 599);

      const willRetry =
        retryable &&
        delivery.attemptCount < MAX_DELIVERY_ATTEMPTS;

      const retryAfter =
        status === 429 || status === 503
          ? error.response?.headers['retry-after']
          : undefined;

      const nextAttemptAt = willRetry
        ? this.buildNextAttemptAt(
            delivery.attemptCount,
            retryAfter,
          )
        : null;

      const deliveryStatus = willRetry
        ? 'RETRY_SCHEDULED'
        : retryable
          ? 'DEAD'
          : 'FAILED';

      const saved = await this.finishAttempt(
        delivery.id,
        processingToken,
        {
          status: deliveryStatus,
          destinationStatus: status ?? null,
          errorMessage: error.message.slice(0, 2000),
          nextAttemptAt,
        },
      );

      if (saved) {
        this.logger.warn(
          nextAttemptAt
            ? `Delivery ${delivery.id} will retry after ` +
                nextAttemptAt.toISOString()
            : `Delivery ${delivery.id} finished as ${deliveryStatus}`,
        );
      }

      return;
    }

    this.maybeCrashForDemo('after-receiver', delivery);

    // Keep this database write outside the HTTP error handler.
    const saved = await this.finishAttempt(
      delivery.id,
      processingToken,
      {
        status: 'DELIVERED',
        destinationStatus,
        errorMessage: null,
        nextAttemptAt: null,
      },
    );

    if (saved) {
      this.logger.log(
        `Delivery ${delivery.id} succeeded on attempt ` +
          delivery.attemptCount,
      );
    }
  }

  private async finishAttempt(
    deliveryId: string,
    processingToken: string,
    data: Prisma.DeliveryUpdateManyMutationInput,
  ): Promise<boolean> {
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
      this.logger.warn(
        `Ignored result for ${deliveryId}: ` +
          'the processing lease expired or ownership changed',
      );
    }

    return result.count === 1;
  }

  private buildNextAttemptAt(
    attemptCount: number,
    retryAfter: unknown,
  ): Date {
    const now = Date.now();

    let delayMs: number =
      RETRY_DELAYS_MS[attemptCount - 1] ?? 120_000;

    if (
      typeof retryAfter === 'string' ||
      typeof retryAfter === 'number'
    ) {
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

  // Controlled failure points for the local tests below.
  private maybeCrashForDemo(
    point: 'after-claim' | 'after-receiver',
    delivery: Pick<Delivery, 'id' | 'eventType' | 'attemptCount'>,
  ) {
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.HOOKRELAY_DEMO_CRASH === point &&
      delivery.eventType === 'demo.worker-crash' &&
      delivery.attemptCount === 1
    ) {
      this.logger.error(
        `Demo crash at ${point} for delivery ${delivery.id}`,
      );

      process.exit(1);
    }
  }

  private async deferDelivery(
  deliveryId: string,
  expectedAttemptCount: number,
  delayMs: number,
  reason: string,
): Promise<void> {
  const jitterMs = Math.floor(Math.random() * 100);

  const result = await this.prisma.delivery.updateMany({
    where: {
      id: deliveryId,
      status: 'PENDING',
      attemptCount: expectedAttemptCount,
    },
    data: {
      status: 'WAITING',
      waitReason: reason,
      nextAttemptAt: new Date(
        Date.now() + Math.max(100, Math.ceil(delayMs)) + jitterMs,
      ),
    },
  });

  if (result.count > 0) {
    this.logger.log(
      `Deferred ${deliveryId}: ${reason}; ` +
        `attempt count remains ${expectedAttemptCount}`,
    );
  }
}

}