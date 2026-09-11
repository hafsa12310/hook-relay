import { PrismaService } from '../prisma/prisma.service.js';
export declare class RetrySchedulerService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    publishDueRetries(): Promise<void>;
}
