import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
export declare class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private readonly producer;
    onModuleInit(): Promise<void>;
    publishDelivery(deliveryId: string): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
