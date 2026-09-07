import { WebhooksService } from './webhooks.service.js';
export declare class WebhooksController {
    private readonly webhooksService;
    constructor(webhooksService: WebhooksService);
    sendWebhook(body: Record<string, unknown>): Promise<{
        delivered: boolean;
        destinationStatus: number;
        receiverResponse: unknown;
    }>;
}
