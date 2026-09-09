import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service.js';

@Controller()
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
  ) {}

  @Post('send-webhook')
  @HttpCode(HttpStatus.ACCEPTED)
  sendWebhook(@Body() body: Record<string, unknown>) {
    return this.webhooksService.sendWebhook(body);
  }

  @Get('deliveries/:id')
  getDelivery(@Param('id') id: string) {
    return this.webhooksService.getDelivery(id);
  }
}