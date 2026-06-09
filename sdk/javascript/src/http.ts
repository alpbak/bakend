import { BakendError } from "./errors.ts";
import type { ApiErrorBody, AuthStore, HttpClient } from "./types.ts";

export interface CreateHttpClientOptions {
  baseUrl: string;
  authStore: AuthStore;
  autoRefresh: boolean;
  refreshFn?: () => Promise<void>;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

async function parseError(response: Response): Promise<BakendError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body?.error) {
      return new BakendError(
        body.error.code,
        body.error.message,
        response.status,
        body.error.details,
      );
    }
  } catch {
    // fall through
  }

  return new BakendError("unknown", `Request failed (${response.status})`, response.status);
}

export function createHttpClient(options: CreateHttpClientOptions): HttpClient {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const { authStore, autoRefresh, refreshFn } = options;

  async function request<T>(
    path: string,
    init: RequestInit = {},
    skipAuth = false,
    isRetry = false,
  ): Promise<T> {
    const headers = new Headers(init.headers);
    const token = authStore.getToken();

    if (!skipAuth && token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (init.body && !headers.has("Content-Type") && !(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
    const response = await fetch(url, { ...init, headers });

    if (response.status === 401 && autoRefresh && !skipAuth && !isRetry && refreshFn) {
      try {
        await refreshFn();
        return request<T>(path, init, skipAuth, true);
      } catch {
        authStore.clear();
        throw await parseError(response);
      }
    }

    if (response.status === 204) {
      return undefined as T;
    }

    if (!response.ok) {
      throw await parseError(response);
    }

    const contentType = response.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }

    return (await response.blob()) as T;
  }

  return {
    request,
    getBaseUrl: () => baseUrl,
    getToken: () => authStore.getToken(),
  };
}
