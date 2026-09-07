import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        instrument: ObserveInstrument,
    });
    await app.listen(process.env.PORT ?? 3000);
    console.log('HookRelay API running at http://localhost:3000');
}
await bootstrap();
//# sourceMappingURL=main.js.map