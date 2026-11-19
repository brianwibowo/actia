import type { FastifyInstance } from 'fastify';
import { query } from '../db/pool.js';
import { isPositiveIntId, isUuid, parseOptionalDate } from '../lib/validate.js';
import { requireAuth } from '../plugins/auth.js';
import { eventBus } from '../services/events.js';

export async function alertRoutes(app: FastifyInstance) {
  app.get('/api/v1/alerts', { preHandler: requireAuth }, async (request) => {
    const q = request.query as {
      status?: string;
      type?: string;
      device_id?: string;
      from?: string;
      to?: string;
    };

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (q.status && ['open', 'acknowledged', 'resolved'].includes(q.status)) {
      params.push(q.status);
      conditions.push(`a.status = $${params.length}`);
    }
    if (q.type && ['battery_low', 'sensor_error', 'offline'].includes(q.type)) {
      params.push(q.type);
      conditions.push(`a.type = $${params.length}`);
    }
    if (q.device_id) {
      if (!isUuid(q.device_id)) {
        return { alerts: [] };
      }
      params.push(q.device_id);
      conditions.push(`a.device_id = $${params.length}`);
    }
    const fromDate = parseOptionalDate(q.from);
    if (fromDate) {
      params.push(fromDate);
      conditions.push(`a.triggered_at >= $${params.length}`);
    }
    const toDate = parseOptionalDate(q.to);
    if (toDate) {
      params.push(toDate);
      conditions.push(`a.triggered_at <= $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await query(
      `SELECT a.id, a.device_id, d.code AS device_code, d.name AS device_name,
              a.type, a.metric, a.value, a.threshold, a.triggered_at,
              a.status, a.acknowledged_at, a.resolved_at,
              u.email AS acknowledged_by_email
       FROM alerts a
       JOIN devices d ON d.id = a.device_id
       LEFT JOIN users u ON u.id = a.acknowledged_by
       ${where}
       ORDER BY
         CASE a.status WHEN 'open' THEN 0 WHEN 'acknowledged' THEN 1 ELSE 2 END,
         a.triggered_at DESC
       LIMIT 250`,
      params,
    );

    return { alerts: res.rows };
  });

  app.patch('/api/v1/alerts/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!isPositiveIntId(id)) {
      return reply.code(404).send({ error: 'Alert tidak ditemukan' });
    }

    const res = await query<{ id: number; device_id: string; type: string }>(
      `UPDATE alerts
       SET status = 'acknowledged',
           acknowledged_by = $2,
           acknowledged_at = NOW()
       WHERE id = $1 AND status = 'open'
       RETURNING id, device_id, type`,
      [id, request.user.id],
    );

    if (!res.rows[0]) {
      return reply.code(404).send({ error: 'Alert tidak ditemukan atau sudah tidak open' });
    }

    eventBus.publish({
      type: 'alert',
      action: 'acknowledged',
      deviceId: res.rows[0].device_id,
      alertType: res.rows[0].type,
    });

    return { ok: true };
  });
}
