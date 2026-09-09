import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WebhooksController } from './webhooks.controller.js';
import { WebhooksService } from './webhooks.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { KafkaProducerService } from '../kafka/kafka-producer.service.js';

@Module({
  imports: [HttpModule,PrismaModule],
  controllers: [WebhooksController],
  providers: [WebhooksService,KafkaProducerService],
})
export class WebhooksModule {}
