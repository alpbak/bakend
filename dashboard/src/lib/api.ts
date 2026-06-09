const TOKEN_KEY = "bakend_token";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export function getToken(): string | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, { ...init, headers });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json()) as T | ApiError;

  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "error" in body
        ? (body as ApiError).error.message
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return body as T;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const body = await apiFetch<{ token: string; user: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  setToken(body.token);
  return body.user;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const body = await apiFetch<{ user: AuthUser }>("/api/auth/me");
  return body.user;
}

export function logout(): void {
  clearToken();
}
