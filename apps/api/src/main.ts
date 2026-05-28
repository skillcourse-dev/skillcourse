import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // CORS: explicit allow-list only. Set CORS_ORIGINS=http://localhost:5173 for dev
  // (Vite default in Plan 4) and CORS_ORIGINS=https://app.example.com for prod. Without
  // CORS_ORIGINS, CORS is OFF entirely. We deliberately do NOT reflect arbitrary origins
  // even in dev: if the dev server is ever tunneled (ngrok, Cloudflare Tunnel) for
  // mobile testing, an "origin: true" reflector would let any site make credentialed
  // requests against it.
  const corsOrigins = process.env.CORS_ORIGINS;
  if (corsOrigins) {
    app.enableCors({ origin: corsOrigins.split(',').map((s) => s.trim()) });
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
