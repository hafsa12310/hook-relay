import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module.js';
import { DeliveryService } from './webhooks/delivery.service.js';
import { createKafkaClient, DELIVERY_TOPIC, } from './kafka/kafka.config.js';


async function bootstrap() {
  const logger = new Logger('DeliveryWorker');

  // Start NestJS services without an HTTP server.
  const app =
    await NestFactory.createApplicationContext(WorkerModule);

  const deliveryService = app.get(DeliveryService);

  const consumer = createKafkaClient('hookrelay-worker').consumer({
    groupId:
      process.env.KAFKA_GROUP_ID ?? 'hookrelay-delivery-workers',
    sessionTimeout: 30000,
  });

  let shuttingDown = false;

  async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.log('Stopping worker');

    // Finish current work before closing connections.
    await consumer.stop();
    await consumer.disconnect();
    await app.close();
  }

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      void shutdown().catch((error: unknown) => {
        console.error(error);
        process.exit(1);
      });
    });
  }

  try {
    await consumer.connect();

    await consumer.subscribe({
      topics: [DELIVERY_TOPIC],
      fromBeginning: true,
    });

    await consumer.run({
      eachMessage: async ({ partition, message }) => {
        const deliveryId = readDeliveryId(
          message.value?.toString() ?? '',
        );

        if (!deliveryId) {
          logger.error(
            `Skipping invalid message at partition ${partition}, ` +
              `offset ${message.offset}`,
          );
          return;
        }

        logger.log(
          `Processing ${deliveryId}, partition ${partition}, ` +
            `offset ${message.offset}`,
        );

        await deliveryService.deliver(deliveryId);
      },
    });

    logger.log('Worker is listening for delivery messages');
  } catch (error: unknown) {
    await shutdown();
    throw error;
  }
}

function readDeliveryId(value: string): string | null {
  try {
    const parsed: unknown = JSON.parse(value);

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('deliveryId' in parsed) ||
      typeof parsed.deliveryId !== 'string' ||
      parsed.deliveryId.trim() === ''
    ) {
      return null;
    }

    return parsed.deliveryId;
  } catch {
    return null;
  }
}

void bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});