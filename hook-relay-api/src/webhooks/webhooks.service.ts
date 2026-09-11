import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DELIVERY_TOPIC } from '../kafka/kafka.config.js';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sendWebhook(body: Record<string, unknown>) {
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      typeof body.type !== 'string' ||
      body.type.trim().length === 0
    ) {
      throw new BadRequestException(
        'The webhook body must contain a non-empty type',
      );
    }

    const eventType = body.type;

    // Nest has already parsed the HTTP JSON body.
    const payload = body as Prisma.InputJsonObject;

    const delivery = await this.prisma.$transaction(async (tx) => {
      // First: save the webhook delivery.
      const createdDelivery = await tx.delivery.create({
        data: {
          eventType,
          payload,
          destinationUrl: 'http://localhost:4000/webhooks',
          status: 'PENDING',
        },
      });

      // Second: save the instruction to publish its ID.
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

    this.logger.log(
      `Delivery ${delivery.id} saved with an outbox event`,
    );

    return {
      accepted: true,
      deliveryId: delivery.id,
      message: 'Delivery saved and queued for publishing',
    };
  }

  async getDelivery(id: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    return delivery;
  }
}