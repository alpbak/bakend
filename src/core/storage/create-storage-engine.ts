import type { Database } from "bun:sqlite";
import type { BakendConfig } from "../config/types.ts";
import type { EventBus } from "../events/types.ts";
import type { Logger } from "../logging/logger.ts";
import { createFileStore, generateFileId } from "./file-store.ts";
import { deleteFile, ensureStorageDir, readFile, writeFile } from "./filesystem.ts";
import type {
  FileMetadata,
  FileVisibility,
  StorageContext,
  StorageEngine,
} from "./types.ts";
import { EmptyFileError, FileTooLargeError, MAX_FILE_SIZE } from "./types.ts";

export interface CreateStorageEngineOptions {
  db: Database;
  config: BakendConfig;
  logger: Logger;
  eventBus: EventBus;
}

function toSafePayload(metadata: FileMetadata): FileMetadata {
  return {
    id: metadata.id,
    filename: metadata.filename,
    mimeType: metadata.mimeType,
    size: metadata.size,
    visibility: metadata.visibility,
    userId: metadata.userId,
    createdAt: metadata.createdAt,
  };
}

export function createStorageEngine(options: CreateStorageEngineOptions): StorageEngine {
  const { db, config, logger, eventBus } = options;
  const fileStore = createFileStore(db);
  const storageRoot = config.storage;

  ensureStorageDir(storageRoot);
  logger.debug(`Storage initialized at ${storageRoot}`);

  function getContext(): StorageContext {
    return {
      async get(id: string): Promise<FileMetadata | null> {
        return fileStore.getById(id);
      },
      async delete(id: string): Promise<boolean> {
        const metadata = fileStore.getById(id);
        if (!metadata) {
          return false;
        }

        fileStore.deleteById(id);
        deleteFile(storageRoot, id);

        eventBus.emit("storage.deleted", {
          source: "storage",
          payload: { id: metadata.id, userId: metadata.userId },
        });

        return true;
      },
    };
  }

  return {
    upload(
      data: Uint8Array,
      filename: string,
      mimeType: string,
      visibility: FileVisibility,
      userId: string,
    ): Promise<FileMetadata> {
      if (data.length === 0) {
        throw new EmptyFileError();
      }

      if (data.length > MAX_FILE_SIZE) {
        throw new FileTooLargeError();
      }

      const id = generateFileId();
      const createdAt = new Date().toISOString();
      const metadata: FileMetadata = {
        id,
        filename,
        mimeType: mimeType || "application/octet-stream",
        size: data.length,
        visibility,
        userId,
        createdAt,
      };

      writeFile(storageRoot, id, data);
      fileStore.insert(metadata);

      eventBus.emit("storage.uploaded", {
        source: "storage",
        payload: toSafePayload(metadata),
      });

      logger.debug(`File uploaded: ${id} (${filename})`);

      return Promise.resolve(metadata);
    },

    getMetadata(id: string): FileMetadata | null {
      return fileStore.getById(id);
    },

    read(id: string): Uint8Array | null {
      const metadata = fileStore.getById(id);
      if (!metadata) {
        return null;
      }

      return readFile(storageRoot, id);
    },

    async delete(id: string): Promise<boolean> {
      return getContext().delete(id);
    },

    exists(id: string): boolean {
      return fileStore.exists(id);
    },

    list(limit, offset) {
      return fileStore.list(limit, offset);
    },

    getContext,
  };
}
