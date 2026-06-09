import type { BakendEvent, HttpClient, RealtimeEventHandler } from "./types.ts";

interface RealtimeMessage {
  type: string;
  channel?: string;
  clientId?: string;
  code?: string;
  message?: string;
  event?: BakendEvent;
}

export class RealtimeModule {
  private readonly http: HttpClient;
  private ws: WebSocket | null = null;
  private readonly handlers = new Map<string, Set<RealtimeEventHandler>>();
  private readonly channelHandlers = new Map<string, RealtimeEventHandler>();
  private connectPromise: Promise<void> | null = null;

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
        resolve();
      };

      ws.onerror = () => {
        this.connectPromise = null;
        reject(new Error("WebSocket connection failed"));
      };

      ws.onclose = () => {
        this.ws = null;
        this.connectPromise = null;
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
    for (const [channel, handlers] of this.handlers) {
      if (this.matchesChannel(channel, event.type)) {
        for (const handler of handlers) {
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
    let handlers = this.handlers.get(channel);
    if (!handlers) {
      handlers = new Set();
      this.handlers.set(channel, handlers);
    }
    handlers.add(handler);
    this.channelHandlers.set(`${channel}:${handlers.size}`, handler);

    void this.ensureConnected().then(() => {
      this.send({ action: "subscribe", channel });
    });

    return () => {
      this.unsubscribe(channel, handler);
    };
  }

  unsubscribe(channel: string, handler?: RealtimeEventHandler): void {
    const handlers = this.handlers.get(channel);
    if (!handlers) {
      return;
    }

    if (handler) {
      handlers.delete(handler);
      if (handlers.size === 0) {
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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
    this.channelHandlers.clear();
    this.connectPromise = null;
  }
}
