import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service.js';

@Controller('send-webhook')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  sendWebhook(@Body() body: Record<string, unknown>) {
    return this.webhooksService.sendWebhook(body);
  }
}
