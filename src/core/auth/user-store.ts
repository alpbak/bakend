import type { Database } from "bun:sqlite";
import type { AuthUser, UserRole } from "./types.ts";
import { DuplicateEmailError } from "./types.ts";

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
}

export function generateUserId(): string {
  return `usr_${crypto.randomUUID()}`;
}

function rowToUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role as UserRole,
    createdAt: row.created_at,
  };
}

export function toSafeUser(user: AuthUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export interface UserStore {
  create(email: string, passwordHash: string, role: UserRole): AuthUser;
  findByEmail(email: string): (AuthUser & { passwordHash: string }) | null;
  findById(id: string): AuthUser | null;
  getPasswordHash(id: string): string | null;
}

export function createUserStore(db: Database): UserStore {
  return {
    create(email, passwordHash, role) {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = db
        .query<UserRow, [string]>("SELECT id FROM _users WHERE email = ?")
        .get(normalizedEmail);

      if (existing) {
        throw new DuplicateEmailError();
      }

      const id = generateUserId();
      const now = new Date().toISOString();

      db.run(
        "INSERT INTO _users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
        [id, normalizedEmail, passwordHash, role, now],
      );

      return {
        id,
        email: normalizedEmail,
        role,
        createdAt: now,
      };
    },

    findByEmail(email) {
      const row = db
        .query<UserRow, [string]>("SELECT * FROM _users WHERE email = ?")
        .get(email.trim().toLowerCase());

      if (!row) {
        return null;
      }

      return {
        ...rowToUser(row),
        passwordHash: row.password_hash,
      };
    },

    findById(id) {
      const row = db.query<UserRow, [string]>("SELECT * FROM _users WHERE id = ?").get(id);
      return row ? rowToUser(row) : null;
    },

    getPasswordHash(id) {
      const row = db
        .query<{ password_hash: string }, [string]>("SELECT password_hash FROM _users WHERE id = ?")
        .get(id);
      return row?.password_hash ?? null;
    },
  };
}
