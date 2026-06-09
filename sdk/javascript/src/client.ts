import { AuthModule } from "./auth.ts";
import { Collection } from "./collection.ts";
import { createHttpClient } from "./http.ts";
import { RealtimeModule } from "./realtime.ts";
import { createMemoryAuthStore } from "./stores/memory.ts";
import { StorageModule } from "./storage.ts";
import type { AuthStore, BakendClientOptions, RecordData } from "./types.ts";

export class BakendClient {
  readonly auth: AuthModule;
  readonly storage: StorageModule;
  readonly realtime: RealtimeModule;

  private readonly http: ReturnType<typeof createHttpClient>;
  private readonly collections = new Map<string, Collection>();

  constructor(baseUrl: string, options: BakendClientOptions = {}) {
    const authStore: AuthStore = options.authStore ?? createMemoryAuthStore();
    const autoRefresh = options.autoRefresh ?? true;

    let httpRef: ReturnType<typeof createHttpClient>;
    httpRef = createHttpClient({
      baseUrl,
      authStore,
      autoRefresh,
      refreshFn: async () => {
        const refreshToken = authStore.getRefreshToken();
        if (!refreshToken) {
          throw new Error("No refresh token");
        }
        const body = await httpRef.request<{
          token: string;
          refreshToken: string;
        }>(
          "/api/auth/refresh",
          {
            method: "POST",
            body: JSON.stringify({ refreshToken }),
          },
          true,
        );
        authStore.setToken(body.token);
        authStore.setRefreshToken(body.refreshToken);
      },
    });

    this.http = httpRef;
    this.auth = new AuthModule(httpRef, authStore);
    this.storage = new StorageModule(httpRef);
    this.realtime = new RealtimeModule(httpRef);
  }

  collection<T extends RecordData = RecordData>(name: string): Collection<T> {
    let handle = this.collections.get(name) as Collection<T> | undefined;
    if (!handle) {
      handle = new Collection<T>(this.http, name);
      this.collections.set(name, handle as Collection);
    }
    return handle;
  }
}
