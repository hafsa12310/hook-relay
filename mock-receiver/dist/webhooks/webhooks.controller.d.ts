export declare class WebhooksController {
    private readonly logger;
    receiveWebhook(body: Record<string, unknown>): {
        received: boolean;
        receivedAt: string;
        data: Record<string, unknown>;
        message: string;
    };
}
