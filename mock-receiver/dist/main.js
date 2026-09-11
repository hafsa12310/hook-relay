import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        instrument: ObserveInstrument,
    });
    app.enableShutdownHooks();
    await app.listen(process.env.PORT ?? 4000);
    console.log('Mock Receiver running at http://localhost:4000');
}
await bootstrap();
//# sourceMappingURL=main.js.map