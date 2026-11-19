import type { FastifyInstance } from 'fastify';
import { query } from '../db/pool.js';
import { requireAuth } from '../plugins/auth.js';
import { eventBus, type StreamEvent } from '../services/events.js';

export async function streamAndHealthRoutes(app: FastifyInstance) {
  app.get('/api/v1/health', async (_request, reply) => {
    try {
      await query('SELECT 1');
      return { ok: true, db: 'connected', ts: new Date().toISOString() };
    } catch {
      return reply.code(503).send({ ok: false, db: 'disconnected' });
    }
  });

  app.get('/api/v1/stream', { preHandler: requireAuth }, async (request, reply) => {
    reply.raw.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    });

    const safeWrite = (chunk: string) => {
      if (!reply.raw.writableEnded && !reply.raw.destroyed) {
        reply.raw.write(chunk);
      }
    };

    safeWrite(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

    const onEvent = (ev: StreamEvent) => {
      safeWrite(`event: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`);
    };

    const keepalive = setInterval(() => {
      safeWrite(': keepalive\n\n');
    }, 25_000);

    eventBus.on('stream', onEvent);

    request.raw.on('close', () => {
      clearInterval(keepalive);
      eventBus.off('stream', onEvent);
    });

    return reply;
  });
}
