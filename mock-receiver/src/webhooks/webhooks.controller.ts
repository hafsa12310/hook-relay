import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  @Post()
  @HttpCode(HttpStatus.OK)
  receiveWebhook(@Body() body: Record<string, unknown>) {
    this.logger.log('Webhook received successfully: ' + JSON.stringify(body));
    
    return {
      received: true,
      receivedAt: new Date().toISOString(),
      data: body,
      message: 'Webhook received successfully!',
    };
  }
}
