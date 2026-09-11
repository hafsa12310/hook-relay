var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WebhookReceiverService_1;
import 'dotenv/config';
import { ConflictException, Injectable, Logger, } from '@nestjs/common';
import { Pool } from 'pg';
let WebhookReceiverService = WebhookReceiverService_1 = class WebhookReceiverService {
    logger = new Logger(WebhookReceiverService_1.name);
    pool;
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
    async receive(deliveryId, body) {
        const client = await this.pool.connect();
        const payload = JSON.stringify(body);
        try {
            await client.query('BEGIN');
            const inserted = await client.query(`
          INSERT INTO processed_webhooks (delivery_id, payload)
          VALUES ($1, $2::jsonb)
          ON CONFLICT (delivery_id) DO NOTHING
          RETURNING delivery_id
        `, [deliveryId, payload]);
            if (inserted.rowCount === 0) {
                const existing = await client.query(`
            SELECT payload = $2::jsonb AS matches
            FROM processed_webhooks
            WHERE delivery_id = $1
          `, [deliveryId, payload]);
                if (existing.rows[0]?.matches !== true) {
                    throw new ConflictException('This delivery ID was already used with a different payload');
                }
                await client.query('COMMIT');
                this.logger.log(`Duplicate ignored: ${deliveryId}`);
                return {
                    received: true,
                    duplicate: true,
                    deliveryId,
                };
            }
            await client.query(`
          INSERT INTO received_events (
            delivery_id,
            event_type,
            payload
          )
          VALUES ($1, $2, $3::jsonb)
        `, [deliveryId, body.type, payload]);
            await client.query('COMMIT');
            this.logger.log(`Event saved: ${deliveryId}`);
            return {
                received: true,
                duplicate: false,
                deliveryId,
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
};
WebhookReceiverService = WebhookReceiverService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], WebhookReceiverService);
export { WebhookReceiverService };
//# sourceMappingURL=webhook-receiver.service.js.map