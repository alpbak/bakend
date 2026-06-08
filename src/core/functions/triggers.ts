import { registerTrigger } from "./trigger-registry.ts";
import type { TriggerHandler } from "./types.ts";

function register(collection: string, type: "create" | "update" | "delete", handler: TriggerHandler): void {
  registerTrigger(collection, type, `${collection}.${type}d`, handler);
}

function registerAuth(collection: string, type: "login" | "register", handler: TriggerHandler): void {
  registerTrigger(collection, type, `auth.${type}`, handler);
}

export function onCreate(collection: string, handler: TriggerHandler): void {
  register(collection, "create", handler);
}

export function onUpdate(collection: string, handler: TriggerHandler): void {
  register(collection, "update", handler);
}

export function onDelete(collection: string, handler: TriggerHandler): void {
  register(collection, "delete", handler);
}

export function onLogin(collection: string, handler: TriggerHandler): void {
  registerAuth(collection, "login", handler);
}

export function onRegister(collection: string, handler: TriggerHandler): void {
  registerAuth(collection, "register", handler);
}
