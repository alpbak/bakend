import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function ensureStorageDir(storageRoot: string): void {
  const filesDir = join(storageRoot, "files");
  mkdirSync(filesDir, { recursive: true });
}

export function filePath(storageRoot: string, fileId: string): string {
  return join(storageRoot, "files", fileId);
}

export function writeFile(storageRoot: string, fileId: string, data: Uint8Array): void {
  ensureStorageDir(storageRoot);
  writeFileSync(filePath(storageRoot, fileId), data);
}

export function readFile(storageRoot: string, fileId: string): Uint8Array | null {
  const path = filePath(storageRoot, fileId);

  if (!existsSync(path)) {
    return null;
  }

  return readFileSync(path);
}

export function deleteFile(storageRoot: string, fileId: string): void {
  const path = filePath(storageRoot, fileId);
  try {
    unlinkSync(path);
  } catch {
    // File may already be missing on disk
  }
}
