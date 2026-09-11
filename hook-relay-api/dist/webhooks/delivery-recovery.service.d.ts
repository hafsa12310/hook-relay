import { PrismaService } from '../prisma/prisma.service.js';
export declare class DeliveryRecoveryService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    recoverExpiredDeliveries(): Promise<void>;
}
