import { HttpService } from '@nestjs/axios';
export declare class WebhooksService {
    private readonly httpService;
    private readonly logger;
    constructor(httpService: HttpService);
    sendWebhook(body: Record<string, unknown>): Promise<{
        delivered: boolean;
        destinationStatus: number;
        receiverResponse: unknown;
    }>;
}
