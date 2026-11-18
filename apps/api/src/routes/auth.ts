import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth } from '../plugins/auth.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance, opts: { cookieSecure: boolean }) {
  app.post(
    '/api/v1/auth/login',
    {
      config: {
        rateLimit: { max: 15, timeWindow: '1 minute' },
      },
    },
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Email atau password tidak valid' });
      }

      const email = parsed.data.email.toLowerCase();
      const res = await query<{
        id: string;
        email: string;
        password_hash: string;
        role: 'admin' | 'viewer';
      }>('SELECT id, email, password_hash, role FROM users WHERE email = $1', [email]);

      const user = res.rows[0];
      if (!user) {
        return reply.code(401).send({ error: 'Email atau password salah' });
      }

      const ok = await bcrypt.compare(parsed.data.password, user.password_hash);
      if (!ok) {
        return reply.code(401).send({ error: 'Email atau password salah' });
      }

      const token = await reply.jwtSign(
        { id: user.id, email: user.email, role: user.role },
        { expiresIn: '7d' },
      );

      reply.setCookie('session', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: opts.cookieSecure,
        maxAge: 60 * 60 * 24 * 7,
      });

      return { user: { id: user.id, email: user.email, role: user.role } };
    },
  );

  app.post('/api/v1/auth/logout', async (_request, reply) => {
    reply.clearCookie('session', { path: '/' });
    return { ok: true };
  });

  app.get('/api/v1/auth/me', { preHandler: requireAuth }, async (request) => {
    return { user: request.user };
  });
}
