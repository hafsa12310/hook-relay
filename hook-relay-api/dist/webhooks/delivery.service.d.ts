import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service.js';
export declare class DeliveryService {
    private readonly prisma;
    private readonly httpService;
    private readonly logger;
    constructor(prisma: PrismaService, httpService: HttpService);
    deliver(deliveryId: string): Promise<void>;
    private finishAttempt;
    private buildNextAttemptAt;
    private maybeCrashForDemo;
}
