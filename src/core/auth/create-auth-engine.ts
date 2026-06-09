import type { Database } from "bun:sqlite";
import { DEFAULT_AUTH_JWT_SECRET } from "../config/defaults.ts";
import type { BakendConfig } from "../config/types.ts";
import type { EventBus } from "../events/types.ts";
import type { Logger } from "../logging/logger.ts";
import { expiresAtFromNow } from "./duration.ts";
import { issueAccessToken, verifyAccessToken } from "./jwt.ts";
import { hashPassword, verifyPassword } from "./password.ts";
import {
  createSessionStore,
  generateRefreshToken,
  type SessionStore,
} from "./session-store.ts";
import type { AuthContext, AuthEngine, AuthTokens, AuthUser, UserRole } from "./types.ts";
import { AuthError, InvalidCredentialsError, InvalidTokenError, USER_ROLES } from "./types.ts";
import { createUserStore, toSafeUser, type UserStore } from "./user-store.ts";

export interface CreateAuthEngineOptions {
  db: Database;
  logger: Logger;
  eventBus: EventBus;
  config: BakendConfig;
  adminEmail?: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateEmail(email: string): void {
  if (!email.includes("@") || email.length < 3) {
    throw new InvalidTokenError("Invalid email address");
  }
}

function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new InvalidTokenError("Password must be at least 8 characters");
  }
}

function resolveRole(email: string, adminEmail?: string): UserRole {
  if (adminEmail && normalizeEmail(email) === adminEmail) {
    return "admin";
  }
  return "authenticated";
}

function parseBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export function createAuthEngine(options: CreateAuthEngineOptions): AuthEngine {
  const { db, logger, eventBus, config, adminEmail } = options;
  const userStore: UserStore = createUserStore(db);
  const sessionStore: SessionStore = createSessionStore(db);
  const { jwtSecret, accessTokenTtl, refreshTokenTtl } = config.auth;

  if (jwtSecret === DEFAULT_AUTH_JWT_SECRET) {
    logger.warn("Using default auth.jwtSecret — set auth.jwtSecret in bakend.json for production");
  }

  async function createTokens(user: AuthUser): Promise<AuthTokens> {
    const refreshToken = generateRefreshToken();
    const expiresAt = expiresAtFromNow(refreshTokenTtl);
    sessionStore.create(user.id, refreshToken, expiresAt);

    const token = await issueAccessToken(user, jwtSecret, accessTokenTtl);
    const safeUser = toSafeUser(user);

    return {
      token,
      refreshToken,
      user: safeUser,
    };
  }

  return {
    async register(email, password) {
      validateEmail(email);
      validatePassword(password);

      const passwordHash = await hashPassword(password);
      const role = resolveRole(email, adminEmail);
      const user = userStore.create(email, passwordHash, role);
      const tokens = await createTokens(user);

      eventBus.emit("auth.register", { source: "auth", payload: tokens.user });
      logger.debug(`User registered: ${user.id}`);

      return tokens;
    },

    async login(email, password) {
      validateEmail(email);

      const user = userStore.findByEmail(email);
      if (!user) {
        throw new InvalidCredentialsError();
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        throw new InvalidCredentialsError();
      }

      const { passwordHash: _passwordHash, ...safeUser } = user;
      const tokens = await createTokens(safeUser);

      eventBus.emit("auth.login", { source: "auth", payload: tokens.user });
      logger.debug(`User logged in: ${user.id}`);

      return tokens;
    },

    async refresh(refreshToken) {
      if (!refreshToken) {
        throw new InvalidTokenError("Refresh token is required");
      }

      const session = sessionStore.findByRefreshToken(refreshToken);
      if (!session) {
        throw new InvalidTokenError("Invalid or expired refresh token");
      }

      const user = userStore.findById(session.userId);
      if (!user) {
        throw new InvalidTokenError("Invalid or expired refresh token");
      }

      sessionStore.revoke(session.sessionId);
      return createTokens(user);
    },

    async logout(refreshToken) {
      if (!refreshToken) {
        throw new InvalidTokenError("Refresh token is required");
      }

      const session = sessionStore.findByRefreshToken(refreshToken);
      if (session) {
        sessionStore.revoke(session.sessionId);
        eventBus.emit("auth.logout", { source: "auth", payload: { userId: session.userId } });
        logger.debug(`User logged out: ${session.userId}`);
        return;
      }

      sessionStore.revokeByRefreshToken(refreshToken);
    },

    async validateAccessToken(token) {
      const claims = await verifyAccessToken(token, jwtSecret);
      if (!claims) {
        return null;
      }

      const user = userStore.findById(claims.id);
      return user ? toSafeUser(user) : null;
    },

    async resolveAuthContext(request) {
      const token = parseBearerToken(request);
      if (!token) {
        return null;
      }

      const user = await this.validateAccessToken(token);
      return user ? { user } : null;
    },

    listUsers(limit, offset) {
      return userStore.list(limit, offset);
    },

    async updateUserRole(id, role) {
      if (!USER_ROLES.includes(role)) {
        throw new AuthError("bad_request", `Invalid role: ${role}`, 400);
      }

      const user = userStore.updateRole(id, role);
      if (!user) {
        throw new AuthError("not_found", "User not found", 404);
      }

      logger.debug(`User role updated: ${id} -> ${role}`);
      return user;
    },

    async deleteUser(id) {
      const deleted = userStore.delete(id);
      if (!deleted) {
        throw new AuthError("not_found", "User not found", 404);
      }

      logger.debug(`User deleted: ${id}`);
      return true;
    },
  };
}
