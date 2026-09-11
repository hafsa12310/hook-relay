import 'dotenv/config';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
export declare class WebhookReceiverService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private readonly pool;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    receive(deliveryId: string, body: Record<string, unknown>): Promise<{
        received: boolean;
        duplicate: boolean;
        deliveryId: string;
    }>;
}
