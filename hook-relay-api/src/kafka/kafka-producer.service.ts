import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  createKafkaClient,
  DELIVERY_TOPIC,
} from './kafka.config.js';

@Injectable()
export class KafkaProducerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(KafkaProducerService.name);

  private readonly producer =
    createKafkaClient('hookrelay-api').producer();

  async onModuleInit() {
    await this.producer.connect();

    this.logger.log('Connected to Kafka');
  }

  async publishDelivery(deliveryId: string) {
    await this.producer.send({
      topic: DELIVERY_TOPIC,
      acks: -1,
      messages: [
        {
          key: deliveryId,
          value: JSON.stringify({ deliveryId }),
        },
      ],
    });

    this.logger.log(`Published delivery ${deliveryId} to Kafka`);
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async publishOutboxEvent(
  topic: string,
  deliveryId: string,
  payload: unknown,
) {
  const value = JSON.stringify(payload);

  if (value === undefined) {
    throw new Error('Outbox payload must be valid JSON');
  }

  await this.producer.send({
    topic,
    acks: -1,
    messages: [
      {
        key: deliveryId,
        value,
      },
    ],
  });
}
}