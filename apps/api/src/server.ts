import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { loadConfig } from './config.js';
import { runMigrations } from './db/migrate.js';
import { closePool } from './db/pool.js';
import { runSeed } from './db/seed.js';
import { alertRoutes } from './routes/alerts.js';
import { authRoutes } from './routes/auth.js';
import { deviceRoutes } from './routes/devices.js';
import { ingestRoutes } from './routes/ingest.js';
import { readingsRoutes } from './routes/readings.js';
import { settingsRoutes } from './routes/settings.js';
import { streamAndHealthRoutes } from './routes/stream.js';

export async function buildApp() {
  const cfg = loadConfig();
  const app = Fastify({
    logger: {
      level: cfg.nodeEnv === 'production' ? 'info' : 'debug',
    },
    trustProxy: true,
  });

  await app.register(cookie);
  await app.register(cors, {
    origin: cfg.corsOrigin,
    credentials: true,
  });
  await app.register(jwt, {
    secret: cfg.jwtSecret,
    cookie: {
      cookieName: 'session',
      signed: false,
    },
  });
  await app.register(rateLimit, {
    global: false,
  });

  await app.register(streamAndHealthRoutes);
  await app.register(authRoutes, { cookieSecure: cfg.cookieSecure });
  await app.register(ingestRoutes, {
    telegramBotToken: cfg.telegramBotToken,
    telegramChatId: cfg.telegramChatId,
  });
  await app.register(deviceRoutes);
  await app.register(readingsRoutes);
  await app.register(alertRoutes);
  await app.register(settingsRoutes);

  return { app, cfg };
}

async function main() {
  await runMigrations();
  await runSeed();

  const { app, cfg } = await buildApp();
  await app.listen({ port: cfg.port, host: cfg.host });

  const shutdown = async () => {
    await app.close();
    await closePool();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
