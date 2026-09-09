import 'dotenv/config';
import { Kafka } from 'kafkajs';
export declare const DELIVERY_TOPIC: string;
export declare function createKafkaClient(clientId: string): Kafka;
