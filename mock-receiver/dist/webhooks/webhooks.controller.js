var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhooksController_1;
import { Body, Controller, HttpCode, HttpStatus, Logger, Post, } from '@nestjs/common';
let WebhooksController = WebhooksController_1 = class WebhooksController {
    logger = new Logger(WebhooksController_1.name);
    receiveWebhook(body) {
        return {
            received: true,
            receivedAt: new Date().toISOString(),
            data: body,
            message: 'Webhook received successfully!',
        };
    }
};
__decorate([
    Post(),
    HttpCode(HttpStatus.OK),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WebhooksController.prototype, "receiveWebhook", null);
WebhooksController = WebhooksController_1 = __decorate([
    Controller('webhooks')
], WebhooksController);
export { WebhooksController };
//# sourceMappingURL=webhooks.controller.js.map