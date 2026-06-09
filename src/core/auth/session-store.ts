import type { Database } from "bun:sqlite";
import { createHash } from "node:crypto";

interface SessionRow {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  expires_at: string;
  created_at: string;
}

export function generateSessionId(): string {
  return `ses_${crypto.randomUUID()}`;
}

export function generateRefreshToken(): string {
  return `rt_${crypto.randomUUID()}${crypto.randomUUID().replace(/-/g, "")}`;
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface SessionStore {
  create(userId: string, refreshToken: string, expiresAt: string): string;
  findByRefreshToken(refreshToken: string): { sessionId: string; userId: string } | null;
  revokeByRefreshToken(refreshToken: string): boolean;
  revoke(sessionId: string): void;
}

export function createSessionStore(db: Database): SessionStore {
  return {
    create(userId, refreshToken, expiresAt) {
      const id = generateSessionId();
      const tokenHash = hashRefreshToken(refreshToken);
      const now = new Date().toISOString();

      db.run(
        "INSERT INTO _sessions (id, user_id, refresh_token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
        [id, userId, tokenHash, expiresAt, now],
      );

      return id;
    },

    findByRefreshToken(refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken);
      const row = db
        .query<SessionRow, [string]>("SELECT * FROM _sessions WHERE refresh_token_hash = ?")
        .get(tokenHash);

      if (!row) {
        return null;
      }

      if (new Date(row.expires_at).getTime() <= Date.now()) {
        db.run("DELETE FROM _sessions WHERE id = ?", [row.id]);
        return null;
      }

      return {
        sessionId: row.id,
        userId: row.user_id,
      };
    },

    revokeByRefreshToken(refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken);
      const result = db.run("DELETE FROM _sessions WHERE refresh_token_hash = ?", [tokenHash]);
      return result.changes > 0;
    },

    revoke(sessionId) {
      db.run("DELETE FROM _sessions WHERE id = ?", [sessionId]);
    },
  };
}
