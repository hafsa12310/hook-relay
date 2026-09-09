import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { KafkaProducerService } from '../kafka/kafka-producer.service.js';
import { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async sendWebhook(body: Record<string, unknown>) {
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      typeof body.type !== 'string' ||
      body.type.trim() === ''
    ) {
      throw new BadRequestException(
        'The request must contain a non-empty type',
      );
    }

    const delivery = await this.prisma.delivery.create({
      data: {
        eventType: body.type,
        payload: body as Prisma.InputJsonObject,
        destinationUrl: 'http://localhost:4000/webhooks',
        status: 'PENDING',
      },
    });

    // 3. Publish the delivery ID to Kafka.
    try {
      await this.kafkaProducer.publishDelivery(delivery.id);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Kafka publication failed: ${message}`);

      throw new ServiceUnavailableException({
        accepted: false,
        deliveryId: delivery.id,
        message:
          'Delivery was saved, but Kafka publication was not confirmed',
      });
    }

    // 4. Confirm acceptance to the caller.
    return {
      accepted: true,
      deliveryId: delivery.id,
      message: 'Delivery accepted for background processing',
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