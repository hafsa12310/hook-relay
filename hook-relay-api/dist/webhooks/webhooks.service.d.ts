import { PrismaService } from '../prisma/prisma.service.js';
export declare class WebhooksService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    sendWebhook(body: Record<string, unknown>): Promise<{
        accepted: boolean;
        deliveryId: string;
        message: string;
    }>;
    getDelivery(id: string): Promise<{
        id: string;
        eventType: string;
        payload: import("@prisma/client/runtime/client").JsonValue;
        destinationUrl: string;
        status: import("../generated/prisma/enums.js").DeliveryStatus;
        destinationStatus: number | null;
        errorMessage: string | null;
        attemptCount: number;
        nextAttemptAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        processingToken: string | null;
        processingExpiresAt: Date | null;
    }>;
}
