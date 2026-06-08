export interface BakendEvent {
  id: string;
  type: string;
  timestamp: string;
  source: string;
  payload: unknown;
}

export type EventHandler = (event: BakendEvent) => void | Promise<void>;

export type UnsubscribeFn = () => void;

export interface EmitOptions {
  source?: string;
  payload?: unknown;
}

export interface EventBus {
  on(type: string, handler: EventHandler): UnsubscribeFn;
  emit(type: string, options?: EmitOptions): void;
  flush(): Promise<void>;
}
