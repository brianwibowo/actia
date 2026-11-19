import { EventEmitter } from 'node:events';
import pg from 'pg';

export const PG_EVENT_CHANNEL = 'actia_events';

export type StreamEvent =
  | { type: 'reading'; deviceId: string; ts: string }
  | { type: 'device_status'; deviceId: string; status: string }
  | { type: 'alert'; action: 'opened' | 'resolved' | 'acknowledged'; deviceId: string; alertType: string };

class EventBus extends EventEmitter {
  publish(event: StreamEvent): void {
    this.emit('stream', event);
  }
}

export const eventBus = new EventBus();
eventBus.setMaxListeners(100);

export function startPgEventListener(databaseUrl: string): () => Promise<void> {
  let closed = false;
  let client: pg.Client | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const scheduleReconnect = () => {
    if (closed || reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void connect();
    }, 3_000);
  };

  const connect = async () => {
    if (closed) return;
    const c = new pg.Client({ connectionString: databaseUrl });
    client = c;

    c.on('notification', (msg) => {
      if (msg.channel !== PG_EVENT_CHANNEL || !msg.payload) return;
      try {
        const parsed = JSON.parse(msg.payload) as StreamEvent;
        if (parsed && typeof parsed.type === 'string') {
          eventBus.publish(parsed);
        }
      } catch {
        // Abaikan payload notifikasi yang bukan JSON valid.
      }
    });

    c.on('error', () => {
      if (client === c) client = null;
      void c.end().catch(() => {});
      scheduleReconnect();
    });

    c.on('end', () => {
      if (client === c) client = null;
      scheduleReconnect();
    });

    try {
      await c.connect();
      await c.query(`LISTEN ${PG_EVENT_CHANNEL}`);
    } catch {
      if (client === c) client = null;
      void c.end().catch(() => {});
      scheduleReconnect();
    }
  };

  void connect();

  return async () => {
    closed = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (client) {
      const c = client;
      client = null;
      await c.end().catch(() => {});
    }
  };
}
