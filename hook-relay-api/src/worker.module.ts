import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from './prisma/prisma.module.js';
import { DeliveryService } from './webhooks/delivery.service.js';

@Module({
  imports: [HttpModule, PrismaModule],
  providers: [DeliveryService],
})
export class WorkerModule {}