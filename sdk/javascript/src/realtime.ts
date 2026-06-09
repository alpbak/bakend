import type { BakendEvent, HttpClient, RealtimeEventHandler } from "./types.ts";

interface RealtimeMessage {
  type: string;
  channel?: string;
  clientId?: string;
  code?: string;
  message?: string;
  event?: BakendEvent;
}

const MAX_RECONNECT_DELAY_MS = 30_000;

export class RealtimeModule {
  private readonly http: HttpClient;
  private ws: WebSocket | null = null;
  private readonly handlers = new Map<string, Set<RealtimeEventHandler>>();
  private connectPromise: Promise<void> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private intentionalClose = false;

  constructor(http: HttpClient) {
    this.http = http;
  }

  private getWsUrl(): string {
    const base = this.http.getBaseUrl().replace(/^http/, "ws");
    const token = this.http.getToken();
    if (token) {
      return `${base}/api/realtime?token=${encodeURIComponent(token)}`;
    }
    return `${base}/api/realtime`;
  }

  private resubscribeAll(): void {
    for (const channel of this.handlers.keys()) {
      this.send({ action: "subscribe", channel });
    }
  }

  private scheduleReconnect(): void {
    if (this.intentionalClose || this.handlers.size === 0) {
      return;
    }

    if (this.reconnectTimer) {
      return;
    }

    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, MAX_RECONNECT_DELAY_MS);
    this.reconnectAttempts += 1;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.ensureConnected().catch(() => {
        this.scheduleReconnect();
      });
    }, delay);
  }

  private async ensureConnected(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(this.getWsUrl());

      ws.onopen = () => {
        this.ws = ws;
        this.connectPromise = null;
        this.reconnectAttempts = 0;
        this.resubscribeAll();
        resolve();
      };

      ws.onerror = () => {
        this.connectPromise = null;
        reject(new Error("WebSocket connection failed"));
      };

      ws.onclose = () => {
        this.ws = null;
        this.connectPromise = null;
        if (!this.intentionalClose) {
          this.scheduleReconnect();
        }
      };

      ws.onmessage = (event) => {
        this.handleMessage(event.data as string);
      };
    });

    return this.connectPromise;
  }

  private handleMessage(raw: string): void {
    let message: RealtimeMessage;
    try {
      message = JSON.parse(raw) as RealtimeMessage;
    } catch {
      return;
    }

    if (message.type !== "event" || !message.event) {
      return;
    }

    const event = message.event;
    for (const [channel, channelHandlers] of this.handlers) {
      if (this.matchesChannel(channel, event.type)) {
        for (const handler of channelHandlers) {
          handler(event);
        }
      }
    }
  }

  private matchesChannel(subscription: string, eventType: string): boolean {
    if (subscription === eventType) {
      return true;
    }
    if (subscription.endsWith(".*")) {
      const prefix = subscription.slice(0, -1);
      return eventType.startsWith(prefix);
    }
    return false;
  }

  private send(data: Record<string, string>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  subscribe(channel: string, handler: RealtimeEventHandler): () => void {
    let channelHandlers = this.handlers.get(channel);
    if (!channelHandlers) {
      channelHandlers = new Set();
      this.handlers.set(channel, channelHandlers);
    }
    channelHandlers.add(handler);

    void this.ensureConnected().then(() => {
      this.send({ action: "subscribe", channel });
    });

    return () => {
      this.unsubscribe(channel, handler);
    };
  }

  unsubscribe(channel: string, handler?: RealtimeEventHandler): void {
    const channelHandlers = this.handlers.get(channel);
    if (!channelHandlers) {
      return;
    }

    if (handler) {
      channelHandlers.delete(handler);
      if (channelHandlers.size === 0) {
        this.handlers.delete(channel);
        this.send({ action: "unsubscribe", channel });
      }
    } else {
      this.handlers.delete(channel);
      this.send({ action: "unsubscribe", channel });
    }
  }

  ping(): void {
    void this.ensureConnected().then(() => {
      this.send({ action: "ping" });
    });
  }

  disconnect(): void {
    this.intentionalClose = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.handlers.clear();
    this.connectPromise = null;
    this.reconnectAttempts = 0;
    this.intentionalClose = false;
  }
}
