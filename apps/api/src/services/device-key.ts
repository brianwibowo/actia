import { createHash, randomBytes } from 'node:crypto';

export function generateDeviceKey(): { raw: string; hash: string } {
  const raw = `dev_${randomBytes(24).toString('base64url')}`;
  return { raw, hash: hashDeviceKey(raw) };
}

export function hashDeviceKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
