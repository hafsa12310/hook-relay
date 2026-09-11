import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './prisma/prisma.module.js';
import { DeliveryService } from './webhooks/delivery.service.js';
import { RetrySchedulerService } from './webhooks/retry-scheduler.service.js';
import { KafkaProducerService } from './kafka/kafka-producer.service.js';
import { OutboxPublisherService } from './outbox/outbox-publisher.service.js';
import { DeliveryRecoveryService } from './webhooks/delivery-recovery.service.js';

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    DeliveryService,
    RetrySchedulerService,
    KafkaProducerService,
    OutboxPublisherService,
    DeliveryRecoveryService
  ],
})
export class WorkerModule {}