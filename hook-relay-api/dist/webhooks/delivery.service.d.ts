import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service.js';
export declare class DeliveryService {
    private readonly httpService;
    private readonly prisma;
    private readonly logger;
    constructor(httpService: HttpService, prisma: PrismaService);
    deliver(deliveryId: string): Promise<void>;
    private parseRetryAfter;
}
