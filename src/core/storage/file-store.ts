import type { Database } from "bun:sqlite";
import type { FileMetadata, FileVisibility } from "./types.ts";

interface FileRow {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
  visibility: string;
  user_id: string;
  created_at: string;
}

export function generateFileId(): string {
  return `fil_${crypto.randomUUID()}`;
}

function rowToMetadata(row: FileRow): FileMetadata {
  return {
    id: row.id,
    filename: row.filename,
    mimeType: row.mime_type,
    size: row.size,
    visibility: row.visibility as FileVisibility,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

export interface FileStore {
  insert(metadata: FileMetadata): void;
  getById(id: string): FileMetadata | null;
  deleteById(id: string): boolean;
  exists(id: string): boolean;
}

export function createFileStore(db: Database): FileStore {
  return {
    insert(metadata: FileMetadata): void {
      db.run(
        `INSERT INTO _files (id, filename, mime_type, size, visibility, user_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          metadata.id,
          metadata.filename,
          metadata.mimeType,
          metadata.size,
          metadata.visibility,
          metadata.userId,
          metadata.createdAt,
        ],
      );
    },

    getById(id: string): FileMetadata | null {
      const row = db
        .query<FileRow, [string]>(
          `SELECT id, filename, mime_type, size, visibility, user_id, created_at
           FROM _files WHERE id = ?`,
        )
        .get(id);

      return row ? rowToMetadata(row) : null;
    },

    deleteById(id: string): boolean {
      const result = db.run("DELETE FROM _files WHERE id = ?", [id]);
      return result.changes > 0;
    },

    exists(id: string): boolean {
      const row = db
        .query<{ id: string }, [string]>("SELECT id FROM _files WHERE id = ?")
        .get(id);

      return row !== null;
    },
  };
}
