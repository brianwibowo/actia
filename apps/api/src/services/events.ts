import { EventEmitter } from 'node:events';

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
