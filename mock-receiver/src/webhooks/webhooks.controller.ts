import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { WebhookReceiverService } from './webhook-receiver.service.js';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly receiverService: WebhookReceiverService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  receiveWebhook(
    @Headers('x-hookrelay-delivery-id') deliveryId: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    if (
      typeof deliveryId !== 'string' ||
      deliveryId.trim().length === 0 ||
      deliveryId.length > 200
    ) {
      throw new BadRequestException(
        'A valid X-HookRelay-Delivery-ID header is required',
      );
    }

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      typeof body.type !== 'string' ||
      body.type.trim().length === 0
    ) {
      throw new BadRequestException(
        'The webhook body must contain a non-empty type',
      );
    }

    return this.receiverService.receive(deliveryId, body);
  }
}