import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAdmin } from '../plugins/auth.js';

const settingsSchema = z.object({
  default_battery_pct_min: z.number().min(0).max(100),
  default_battery_voltage_min: z.number().min(0).max(60),
  default_offline_after_s: z.number().int().min(30).max(604800),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['admin', 'viewer']).default('viewer'),
});

export async function settingsRoutes(app: FastifyInstance) {
  app.get('/api/v1/settings', { preHandler: requireAdmin }, async () => {
    const res = await query(
      `SELECT default_battery_pct_min, default_battery_voltage_min,
              default_offline_after_s, updated_at
       FROM system_settings WHERE id = 1`,
    );
    return { settings: res.rows[0] };
  });

  app.patch('/api/v1/settings', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = settingsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Input tidak valid' });
    }

    const s = parsed.data;
    const res = await query(
      `UPDATE system_settings
       SET default_battery_pct_min = $1,
           default_battery_voltage_min = $2,
           default_offline_after_s = $3,
           updated_at = NOW()
       WHERE id = 1
       RETURNING default_battery_pct_min, default_battery_voltage_min,
                 default_offline_after_s, updated_at`,
      [s.default_battery_pct_min, s.default_battery_voltage_min, s.default_offline_after_s],
    );
    return { settings: res.rows[0] };
  });

  app.get('/api/v1/users', { preHandler: requireAdmin }, async () => {
    const res = await query(
      'SELECT id, email, role, created_at FROM users ORDER BY created_at ASC',
    );
    return { users: res.rows };
  });

  app.post('/api/v1/users', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = createUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Input tidak valid' });
    }

    const hash = await bcrypt.hash(parsed.data.password, 10);
    try {
      const res = await query(
        `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, $3)
         RETURNING id, email, role, created_at`,
        [parsed.data.email.toLowerCase(), hash, parsed.data.role],
      );
      return reply.code(201).send({ user: res.rows[0] });
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      if (pgErr.code === '23505') {
        return reply.code(409).send({ error: 'Email sudah terdaftar' });
      }
      throw err;
    }
  });

  app.delete('/api/v1/users/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (id === request.user.id) {
      return reply.code(400).send({ error: 'Tidak bisa menghapus akun sendiri' });
    }
    const res = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (res.rowCount === 0) {
      return reply.code(404).send({ error: 'User tidak ditemukan' });
    }
    return { ok: true };
  });
}
