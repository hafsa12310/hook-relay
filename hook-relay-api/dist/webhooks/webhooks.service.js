var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WebhooksService_1;
import { BadGatewayException, Injectable, Logger, } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
let WebhooksService = WebhooksService_1 = class WebhooksService {
    httpService;
    logger = new Logger(WebhooksService_1.name);
    constructor(httpService) {
        this.httpService = httpService;
    }
    async sendWebhook(body) {
        const receiverUrl = 'http://localhost:4000/webhooks';
        try {
            const response = await this.httpService.axiosRef.post(receiverUrl, body, { timeout: 5000 });
            this.logger.log('Webhook delivered successfully');
            return {
                delivered: true,
                destinationStatus: response.status,
                receiverResponse: response.data,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Webhook delivery failed: ${message}`);
            throw new BadGatewayException({
                delivered: false,
                message: 'Could not deliver the webhook to the receiver',
            });
        }
    }
};
WebhooksService = WebhooksService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [HttpService])
], WebhooksService);
export { WebhooksService };
//# sourceMappingURL=webhooks.service.js.map