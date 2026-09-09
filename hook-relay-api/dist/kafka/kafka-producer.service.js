var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var KafkaProducerService_1;
import { Injectable, Logger, } from '@nestjs/common';
import { createKafkaClient, DELIVERY_TOPIC, } from './kafka.config.js';
let KafkaProducerService = KafkaProducerService_1 = class KafkaProducerService {
    logger = new Logger(KafkaProducerService_1.name);
    producer = createKafkaClient('hookrelay-api').producer();
    async onModuleInit() {
        await this.producer.connect();
        this.logger.log('Connected to Kafka');
    }
    async publishDelivery(deliveryId) {
        await this.producer.send({
            topic: DELIVERY_TOPIC,
            acks: -1,
            messages: [
                {
                    key: deliveryId,
                    value: JSON.stringify({ deliveryId }),
                },
            ],
        });
        this.logger.log(`Published delivery ${deliveryId} to Kafka`);
    }
    async onModuleDestroy() {
        await this.producer.disconnect();
    }
};
KafkaProducerService = KafkaProducerService_1 = __decorate([
    Injectable()
], KafkaProducerService);
export { KafkaProducerService };
//# sourceMappingURL=kafka-producer.service.js.map