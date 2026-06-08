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
  VALUES ('schema_version', '1');

  CREATE TABLE IF NOT EXISTS _collections (
    name TEXT PRIMARY KEY,
    definition TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

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
