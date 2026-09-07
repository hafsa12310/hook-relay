import {
  BadGatewayException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly httpService: HttpService) {}

  async sendWebhook(body: Record<string, unknown>) {
    const receiverUrl = 'http://localhost:4000/webhooks';

    try {
      const response =
        await this.httpService.axiosRef.post<unknown>(
          receiverUrl,
          body,
          { timeout: 5000 },
        );

      this.logger.log('Webhook delivered successfully');

      return {
        delivered: true,
        destinationStatus: response.status,
        receiverResponse: response.data,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Webhook delivery failed: ${message}`);

      throw new BadGatewayException({
        delivered: false,
        message: 'Could not deliver the webhook to the receiver',
      });
    }
  }
}