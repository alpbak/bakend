import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { BakendConfig } from "../config/types.ts";
import type { Logger } from "../logging/logger.ts";

const BOOTSTRAP_SQL = `
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS _bakend_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  INSERT OR IGNORE INTO _bakend_meta (key, value)
  VALUES ('schema_version', '2');

  CREATE TABLE IF NOT EXISTS _collections (
    name TEXT PRIMARY KEY,
    definition TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS _users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'authenticated',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS _sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES _users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

const MIGRATION_V2_SQL = `
  CREATE TABLE IF NOT EXISTS _users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'authenticated',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS _sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES _users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  UPDATE _bakend_meta SET value = '2' WHERE key = 'schema_version';
`;

function runMigrations(db: Database, logger: Logger): void {
  const version = getSchemaVersion(db);

  if (version === "1") {
    db.run(MIGRATION_V2_SQL);
    logger.debug("Database migrated from schema version 1 to 2");
  }
}

export function initDatabase(config: BakendConfig, logger: Logger): Database {
  const databasePath = config.database;

  if (databasePath !== ":memory:") {
    const directory = dirname(databasePath);
    if (directory && directory !== ".") {
      mkdirSync(directory, { recursive: true });
    }
  }

  try {
    const db = new Database(databasePath, { create: true });
    db.run(BOOTSTRAP_SQL);
    runMigrations(db, logger);
    logger.debug(`Database initialized at ${databasePath}`);
    return db;
  } catch (error) {
    logger.error(`Failed to initialize database: ${String(error)}`);
    throw error;
  }
}

export function closeDatabase(db: Database): void {
  db.close();
}

export function getSchemaVersion(db: Database): string {
  const row = db
    .query<{ value: string }, []>("SELECT value FROM _bakend_meta WHERE key = 'schema_version'")
    .get();

  return row?.value ?? "0";
}
