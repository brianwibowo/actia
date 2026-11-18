import type { FastifyReply, FastifyRequest } from 'fastify';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'viewer';
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthUser;
    user: AuthUser;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify({ onlyCookie: true });
  } catch {
    return reply.code(401).send({ error: 'Sesi tidak valid atau sudah berakhir' });
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await requireAuth(request, reply);
  if (reply.sent) return;
  if (request.user.role !== 'admin') {
    return reply.code(403).send({ error: 'Akses khusus admin' });
  }
}
