import { loadConfig } from './config.js';
import { runMigrations } from './db/migrate.js';
import { closePool, withTransaction } from './db/pool.js';
import { openAlertIfNotExists } from './services/alert-evaluator.js';
import { sendTelegramAlert } from './services/notifier.js';

export async function checkOfflineDevices(
  telegramBotToken: string,
  telegramChatId: string,
): Promise<number> {
  const newlyOffline: Array<{ id: string; code: string; name: string; elapsedS: number }> = [];

  await withTransaction(async (client) => {
    const res = await client.query<{
      id: string;
      code: string;
      name: string;
      offline_after_s: number;
      elapsed_s: number | null;
    }>(
      `SELECT d.id, d.code, d.name,
              COALESCE(dt.offline_after_s, s.default_offline_after_s, 900) AS offline_after_s,
              EXTRACT(EPOCH FROM (NOW() - d.last_seen))::int AS elapsed_s
       FROM devices d
       CROSS JOIN system_settings s
       LEFT JOIN device_thresholds dt ON dt.device_id = d.id
       WHERE s.id = 1
         AND d.status = 'online'
         AND (
           d.last_seen IS NULL
           OR NOW() - d.last_seen > make_interval(secs => COALESCE(dt.offline_after_s, s.default_offline_after_s, 900))
         )`,
    );

    for (const row of res.rows) {
      await client.query(`UPDATE devices SET status = 'offline' WHERE id = $1`, [row.id]);
      const opened = await openAlertIfNotExists(
        client,
        row.id,
        'offline',
        'heartbeat',
        row.elapsed_s,
        row.offline_after_s,
      );
      if (opened) {
        newlyOffline.push({
          id: row.id,
          code: row.code,
          name: row.name,
          elapsedS: row.elapsed_s ?? row.offline_after_s,
        });
      }
    }
  });

  for (const node of newlyOffline) {
    const mins = Math.round(node.elapsedS / 60);
    await sendTelegramAlert(
      telegramBotToken,
      telegramChatId,
      `[ALERT BARU] ${node.code} ${node.name}: offline (tidak mengirim data selama ${mins} menit)`,
    );
  }

  return newlyOffline.length;
}

async function main() {
  const cfg = loadConfig();
  await runMigrations();

  console.log(`Offline worker berjalan setiap ${cfg.workerIntervalS} detik`);

  const runTick = async () => {
    try {
      const count = await checkOfflineDevices(cfg.telegramBotToken, cfg.telegramChatId);
      if (count > 0) {
        console.log(`Worker menandai ${count} node offline`);
      }
    } catch (err) {
      console.error('Worker tick error:', err);
    }
  };

  await runTick();
  const timer = setInterval(runTick, cfg.workerIntervalS * 1000);

  const shutdown = async () => {
    clearInterval(timer);
    await closePool();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
