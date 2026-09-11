import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller.js';
import { WebhookReceiverService } from './webhook-receiver.service.js';

@Module({
  controllers: [WebhooksController],
  providers: [WebhookReceiverService],
})
export class WebhooksModule {}
