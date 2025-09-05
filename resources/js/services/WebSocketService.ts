// Minimal stub implementation for WebSocket-like service used by WebSocketProvider
// This can be replaced with a real Echo/Pusher or WebSocket implementation later.

type Listener = (...args: any[]) => void;

class SimpleEventBus {
  private listeners: Record<string, Set<Listener>> = {};

  on(event: string, cb: Listener) {
    if (!this.listeners[event]) this.listeners[event] = new Set();
    this.listeners[event].add(cb);
  }

  off(event: string, cb: Listener) {
    this.listeners[event]?.delete(cb);
  }

  emit(event: string, ...args: any[]) {
    this.listeners[event]?.forEach((cb) => cb(...args));
  }
}

class WebSocketService {
  private connected = false;
  private bus = new SimpleEventBus();
  private status: Record<string, any> = { connected: false };

  async initialize(): Promise<boolean> {
    // Simulate async connect
    await Promise.resolve();
    this.connected = true;
    this.status.connected = true;
    return true;
  }

  disconnect(): void {
    this.connected = false;
    this.status.connected = false;
  }

  getConnectionStatus(): Record<string, any> {
    return { ...this.status };
  }

  async getRealtimeData(): Promise<{ success: boolean; data: any }>{
    return { success: true, data: null };
  }

  async getNotificationCount(): Promise<{ success: boolean; data: any }>{
    return { success: true, data: 0 };
  }

  on(eventType: string, callback: Listener): void {
    this.bus.on(eventType, callback);
  }

  off(eventType: string, callback: Listener): void {
    this.bus.off(eventType, callback);
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
