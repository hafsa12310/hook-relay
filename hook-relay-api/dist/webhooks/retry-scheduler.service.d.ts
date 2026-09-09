import { PrismaService } from '../prisma/prisma.service.js';
import { KafkaProducerService } from '../kafka/kafka-producer.service.js';
export declare class RetrySchedulerService {
    private readonly prisma;
    private readonly kafkaProducer;
    private readonly logger;
    constructor(prisma: PrismaService, kafkaProducer: KafkaProducerService);
    publishDueRetries(): Promise<void>;
}
