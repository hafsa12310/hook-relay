import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from './prisma/prisma.module.js';
import { DeliveryService } from './webhooks/delivery.service.js';
import { RetrySchedulerService } from './webhooks/retry-scheduler.service.js';
import { ScheduleModule } from '@nestjs/schedule';
import { KafkaProducerService } from './kafka/kafka-producer.service.js';

@Module({
  imports: [HttpModule, PrismaModule,ScheduleModule.forRoot(),],
  providers: [DeliveryService, RetrySchedulerService, KafkaProducerService],
})
export class WorkerModule {}