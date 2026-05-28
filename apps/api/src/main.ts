import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // CORS: in dev the Vite web app runs on a different port (5173 by default).
  // Plan 4 will tighten this; for now, accept any origin in dev mode and
  // only the configured origins in production.
  const corsOrigins = process.env.CORS_ORIGINS;
  if (corsOrigins) {
    app.enableCors({ origin: corsOrigins.split(',').map((s) => s.trim()) });
  } else if (process.env.NODE_ENV !== 'production') {
    app.enableCors({ origin: true });
  }

  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`[api] listening on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
