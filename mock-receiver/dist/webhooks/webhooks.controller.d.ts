import { WebhookReceiverService } from './webhook-receiver.service.js';
export declare class WebhooksController {
    private readonly receiverService;
    constructor(receiverService: WebhookReceiverService);
    receiveWebhook(deliveryId: string | undefined, body: Record<string, unknown>): Promise<{
        received: boolean;
        duplicate: boolean;
        deliveryId: string;
    }>;
}
