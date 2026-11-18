export interface AppConfig {
  port: number;
  host: string;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  cookieSecure: boolean;
  corsOrigin: string;
  adminEmail: string;
  adminPassword: string;
  telegramBotToken: string;
  telegramChatId: string;
  workerIntervalS: number;
}

export function loadConfig(): AppConfig {
  const databaseUrl =
    process.env.DATABASE_URL ??
    'postgresql://telemetry:telemetry@localhost:5432/telemetry';
  const jwtSecret =
    process.env.JWT_SECRET ?? 'dev-only-secret-change-in-production-32chars';

  if (process.env.NODE_ENV === 'production' && jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }

  return {
    port: Number(process.env.PORT ?? 3000),
    host: process.env.HOST ?? '0.0.0.0',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    databaseUrl,
    jwtSecret,
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    adminEmail: process.env.ADMIN_EMAIL ?? 'admin@example.com',
    adminPassword: process.env.ADMIN_PASSWORD ?? 'admin12345',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
    telegramChatId: process.env.TELEGRAM_CHAT_ID ?? '',
    workerIntervalS: Math.max(15, Number(process.env.WORKER_INTERVAL_S ?? 60)),
  };
}
