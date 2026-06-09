import type { EventBus } from "../events/types.ts";
import type { BakendEvent } from "../events/types.ts";
import type { Logger } from "../logging/logger.ts";
import type { CollectionsEngine } from "../collections/types.ts";
import { matchesChannel, isValidChannel } from "./channel-matcher.ts";
import { canReceiveCollectionEvent } from "./permissions.ts";
import type {
  ClientMessage,
  RealtimeEngine,
  RealtimeErrorCode,
  RealtimeSocket,
  ServerMessage,
} from "./types.ts";
import { MAX_SUBSCRIPTIONS_PER_CONNECTION } from "./types.ts";

export interface CreateRealtimeEngineOptions {
  eventBus: EventBus;
  collections: CollectionsEngine;
  logger: Logger;
}

function createClientId(): string {
  return `rt_${crypto.randomUUID()}`;
}

function sendMessage(ws: RealtimeSocket, message: ServerMessage): void {
  try {
    ws.send(JSON.stringify(message));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to send realtime message: ${msg}`);
  }
}

function sendError(ws: RealtimeSocket, code: RealtimeErrorCode, message: string): void {
  sendMessage(ws, { type: "error", code, message });
}

function parseClientMessage(raw: string): ClientMessage | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const action = (parsed as { action?: unknown }).action;
    if (action === "ping") {
      return { action: "ping" };
    }

    if (action === "subscribe" || action === "unsubscribe") {
      const channel = (parsed as { channel?: unknown }).channel;
      if (typeof channel !== "string") {
        return null;
      }

      return { action, channel };
    }

    return null;
  } catch {
    return null;
  }
}

export function createRealtimeEngine(options: CreateRealtimeEngineOptions): RealtimeEngine {
  const { eventBus, collections, logger } = options;
  const connections = new Set<RealtimeSocket>();

  function fanOut(event: BakendEvent): void {
    for (const ws of connections) {
      const data = ws.data;
      if (!data) {
        continue;
      }

      let matched = false;
      for (const subscription of data.subscriptions) {
        if (!matchesChannel(subscription, event.type)) {
          continue;
        }

        matched = true;
        break;
      }

      if (!matched) {
        continue;
      }

      if (!canReceiveCollectionEvent(collections, data.authContext, event)) {
        continue;
      }

      try {
        sendMessage(ws, {
          type: "event",
          event: {
            id: event.id,
            type: event.type,
            timestamp: event.timestamp,
            source: event.source,
            payload: event.payload,
          },
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Realtime send failed for ${data.clientId}: ${message}`);
        try {
          ws.close();
        } catch {
          // ignore close errors
        }
        connections.delete(ws);
      }
    }
  }

  const unsubscribeBus = eventBus.onAny(fanOut);

  return {
    handleOpen(ws) {
      const clientId = createClientId();
      const authContext = ws.data?.authContext ?? null;
      ws.data = {
        clientId,
        authContext,
        subscriptions: new Set(),
      };
      connections.add(ws);

      try {
        sendMessage(ws, { type: "connected", clientId });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Realtime connect failed for ${clientId}: ${message}`);
        connections.delete(ws);
        ws.close();
      }
    },

    handleMessage(ws, raw) {
      const message = parseClientMessage(raw);
      if (!message) {
        sendError(ws, "invalid_json", "Invalid JSON message");
        return;
      }

      if (message.action === "ping") {
        sendMessage(ws, { type: "pong" });
        return;
      }

      if (!isValidChannel(message.channel)) {
        sendError(ws, "invalid_channel", "Channel name is invalid");
        return;
      }

      const data = ws.data;
      if (!data) {
        return;
      }

      if (message.action === "subscribe") {
        if (data.subscriptions.has(message.channel)) {
          sendMessage(ws, { type: "subscribed", channel: message.channel });
          return;
        }

        if (data.subscriptions.size >= MAX_SUBSCRIPTIONS_PER_CONNECTION) {
          sendError(ws, "subscription_limit", `Maximum ${MAX_SUBSCRIPTIONS_PER_CONNECTION} subscriptions per connection`);
          return;
        }

        data.subscriptions.add(message.channel);
        sendMessage(ws, { type: "subscribed", channel: message.channel });
        return;
      }

      if (message.action === "unsubscribe") {
        data.subscriptions.delete(message.channel);
        sendMessage(ws, { type: "unsubscribed", channel: message.channel });
        return;
      }

      sendError(ws, "invalid_action", "Unknown action");
    },

    handleClose(ws) {
      connections.delete(ws);
    },

    shutdown() {
      unsubscribeBus();
      for (const ws of connections) {
        try {
          ws.close();
        } catch {
          // ignore
        }
      }
      connections.clear();
    },
  };
}
