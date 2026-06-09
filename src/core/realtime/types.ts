import type { ServerWebSocket } from "bun";
import type { AuthContext } from "../auth/types.ts";

export const MAX_SUBSCRIPTIONS_PER_CONNECTION = 50;

export const COLLECTION_EVENT_SUFFIXES = ["created", "updated", "deleted"] as const;

export type RealtimeErrorCode =
  | "invalid_json"
  | "invalid_action"
  | "invalid_channel"
  | "subscription_limit"
  | "already_subscribed";

export interface RealtimeConnectionData {
  clientId: string;
  authContext: AuthContext | null;
  subscriptions: Set<string>;
}

export type RealtimeSocket = ServerWebSocket<RealtimeConnectionData>;

export interface ClientSubscribeMessage {
  action: "subscribe";
  channel: string;
}

export interface ClientUnsubscribeMessage {
  action: "unsubscribe";
  channel: string;
}

export interface ClientPingMessage {
  action: "ping";
}

export type ClientMessage = ClientSubscribeMessage | ClientUnsubscribeMessage | ClientPingMessage;

export interface ServerConnectedMessage {
  type: "connected";
  clientId: string;
}

export interface ServerSubscribedMessage {
  type: "subscribed";
  channel: string;
}

export interface ServerUnsubscribedMessage {
  type: "unsubscribed";
  channel: string;
}

export interface ServerEventMessage {
  type: "event";
  event: {
    id: string;
    type: string;
    timestamp: string;
    source: string;
    payload: unknown;
  };
}

export interface ServerErrorMessage {
  type: "error";
  code: RealtimeErrorCode;
  message: string;
}

export interface ServerPongMessage {
  type: "pong";
}

export type ServerMessage =
  | ServerConnectedMessage
  | ServerSubscribedMessage
  | ServerUnsubscribedMessage
  | ServerEventMessage
  | ServerErrorMessage
  | ServerPongMessage;

export interface RealtimeEngine {
  handleOpen(ws: RealtimeSocket): void;
  handleMessage(ws: RealtimeSocket, raw: string): void;
  handleClose(ws: RealtimeSocket): void;
  shutdown(): void;
}
