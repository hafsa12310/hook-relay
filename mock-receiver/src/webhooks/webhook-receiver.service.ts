import 'dotenv/config';

import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class WebhookReceiverService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(WebhookReceiverService.name);
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env.RECEIVER_DATABASE_URL;

    if (!connectionString) {
      throw new Error('RECEIVER_DATABASE_URL is missing');
    }

    this.pool = new Pool({ connectionString });

    this.pool.on('error', (error) => {
      this.logger.error(`Database connection error: ${error.message}`);
    });
  }

  async onModuleInit() {
    await this.pool.query('SELECT 1');
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async receive(
    deliveryId: string,
    body: Record<string, unknown>,
  ) {
    const client = await this.pool.connect();
    const payload = JSON.stringify(body);

    try {
      await client.query('BEGIN');

      const inserted = await client.query(
        `
          INSERT INTO processed_webhooks (delivery_id, payload)
          VALUES ($1, $2::jsonb)
          ON CONFLICT (delivery_id) DO NOTHING
          RETURNING delivery_id
        `,
        [deliveryId, payload],
      );

      // No row inserted means this ID has already been processed.
      if (inserted.rowCount === 0) {
        const existing = await client.query<{ matches: boolean }>(
          `
            SELECT payload = $2::jsonb AS matches
            FROM processed_webhooks
            WHERE delivery_id = $1
          `,
          [deliveryId, payload],
        );

        if (existing.rows[0]?.matches !== true) {
          throw new ConflictException(
            'This delivery ID was already used with a different payload',
          );
        }

        await client.query('COMMIT');

        this.logger.log(`Duplicate ignored: ${deliveryId}`);

        return {
          received: true,
          duplicate: true,
          deliveryId,
        };
      }

      // This database write is our demo business action.
      await client.query(
        `
          INSERT INTO received_events (
            delivery_id,
            event_type,
            payload
          )
          VALUES ($1, $2, $3::jsonb)
        `,
        [deliveryId, body.type, payload],
      );

      await client.query('COMMIT');

      this.logger.log(`Event saved: ${deliveryId}`);

      return {
        received: true,
        duplicate: false,
        deliveryId,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}