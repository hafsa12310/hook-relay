import { PrismaService } from '../prisma/prisma.service.js';
import { KafkaProducerService } from '../kafka/kafka-producer.service.js';
export declare class OutboxPublisherService {
    private readonly prisma;
    private readonly kafkaProducer;
    private readonly logger;
    private readonly claimDurationMs;
    private readonly retryDelayMs;
    constructor(prisma: PrismaService, kafkaProducer: KafkaProducerService);
    publishPendingEvents(): Promise<void>;
}
