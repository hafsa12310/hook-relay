import 'dotenv/config';
import { Kafka } from 'kafkajs';
export const DELIVERY_TOPIC = process.env.KAFKA_TOPIC ?? 'webhook.delivery.requested.v1';
export function createKafkaClient(clientId) {
    const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092')
        .split(',')
        .map((broker) => broker.trim());
    return new Kafka({
        clientId,
        brokers,
    });
}
//# sourceMappingURL=kafka.config.js.map