import bcrypt from 'bcryptjs';
import { loadConfig } from '../config.js';
import { closePool, query } from './pool.js';

export async function runSeed(): Promise<void> {
  const cfg = loadConfig();
  const hash = await bcrypt.hash(cfg.adminPassword, 10);

  await query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    [cfg.adminEmail.toLowerCase(), hash],
  );
  console.log(`Admin ensured: ${cfg.adminEmail.toLowerCase()}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed()
    .then(() => closePool())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
