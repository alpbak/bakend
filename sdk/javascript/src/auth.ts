import type { AuthCredentials, AuthStore, AuthTokens, AuthUser, HttpClient } from "./types.ts";

export class AuthModule {
  private readonly http: HttpClient;
  private readonly store: AuthStore;

  constructor(http: HttpClient, store: AuthStore) {
    this.http = http;
    this.store = store;
  }

  get token(): string | null {
    return this.store.getToken();
  }

  get refreshToken(): string | null {
    return this.store.getRefreshToken();
  }

  private saveTokens(tokens: AuthTokens): AuthUser {
    this.store.setToken(tokens.token);
    this.store.setRefreshToken(tokens.refreshToken);
    return tokens.user;
  }

  async register(credentials: AuthCredentials): Promise<AuthUser> {
    const body = await this.http.request<AuthTokens>(
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify(credentials),
      },
      true,
    );
    return this.saveTokens(body);
  }

  async login(credentials: AuthCredentials): Promise<AuthUser> {
    const body = await this.http.request<AuthTokens>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify(credentials),
      },
      true,
    );
    return this.saveTokens(body);
  }

  async refresh(refreshToken?: string): Promise<AuthUser> {
    const token = refreshToken ?? this.store.getRefreshToken();
    if (!token) {
      throw new Error("No refresh token available");
    }

    const body = await this.http.request<AuthTokens>(
      "/api/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken: token }),
      },
      true,
    );
    return this.saveTokens(body);
  }

  async logout(refreshToken?: string): Promise<void> {
    const token = refreshToken ?? this.store.getRefreshToken();
    if (token) {
      await this.http.request<void>(
        "/api/auth/logout",
        {
          method: "POST",
          body: JSON.stringify({ refreshToken: token }),
        },
        true,
      );
    }
    this.store.clear();
  }

  async getMe(): Promise<AuthUser> {
    const body = await this.http.request<{ user: AuthUser }>("/api/auth/me");
    return body.user;
  }

  clear(): void {
    this.store.clear();
  }
}
