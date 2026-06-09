export { BakendClient } from "./client.ts";
export { BakendError } from "./errors.ts";
export { AuthModule } from "./auth.ts";
export { Collection } from "./collection.ts";
export { StorageModule } from "./storage.ts";
export { RealtimeModule } from "./realtime.ts";
export { createMemoryAuthStore } from "./stores/memory.ts";
export {
  createLocalStorageAuthStore,
  createSessionStorageAuthStore,
} from "./stores/browser.ts";
export type {
  AuthUser,
  AuthCredentials,
  AuthTokens,
  AuthStore,
  BakendClientOptions,
  BakendEvent,
  FileMetadata,
  FileVisibility,
  ListResult,
  RealtimeEventHandler,
  RecordData,
  UploadOptions,
  ValidationDetail,
} from "./types.ts";
