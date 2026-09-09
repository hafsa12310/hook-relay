import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async deliver(deliveryId: string): Promise<void> {
    // 1. Find the saved message.
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new Error(`Delivery ${deliveryId} does not exist`);
    }

    // 2. Only attempt pending deliveries.
    if (delivery.status !== 'PENDING') {
      this.logger.log(
        `Skipping ${deliveryId}: status is ${delivery.status}`,
      );
      return;
    }

    let destinationStatus: number;

    try {
      // 3. Send the webhook.
      const response =
        await this.httpService.axiosRef.post<unknown>(
          delivery.destinationUrl,
          delivery.payload,
          { timeout: 5000 },
        );

      destinationStatus = response.status;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      const responseStatus = axios.isAxiosError(error)
        ? (error.response?.status ?? null)
        : null;

      // 4. Record an unsuccessful attempt.
      await this.prisma.delivery.update({
        where: { id: deliveryId },
        data: {
          status: 'FAILED',
          destinationStatus: responseStatus,
          errorMessage,
        },
      });

      this.logger.warn(
        `Delivery ${deliveryId} failed: ${errorMessage}`,
      );

      return;
    }

    // 5. Record success.
    await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: 'DELIVERED',
        destinationStatus,
        errorMessage: null,
      },
    });

    this.logger.log(`Delivery ${deliveryId} delivered`);
  }
}