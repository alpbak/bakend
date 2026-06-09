export const FILE_VISIBILITIES = ["public", "protected"] as const;

export type FileVisibility = (typeof FILE_VISIBILITIES)[number];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export interface FileMetadata {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  visibility: FileVisibility;
  userId: string;
  createdAt: string;
}

export interface FileListResult {
  items: FileMetadata[];
  total: number;
}

export interface StorageEngine {
  upload(
    data: Uint8Array,
    filename: string,
    mimeType: string,
    visibility: FileVisibility,
    userId: string,
  ): Promise<FileMetadata>;
  getMetadata(id: string): FileMetadata | null;
  read(id: string): Uint8Array | null;
  delete(id: string): Promise<boolean>;
  exists(id: string): boolean;
  list(limit: number, offset: number): FileListResult;
  getContext(): StorageContext;
}

export interface StorageContext {
  get(id: string): Promise<FileMetadata | null>;
  delete(id: string): Promise<boolean>;
}

export class StorageError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "StorageError";
    this.code = code;
    this.status = status;
  }
}

export class FileTooLargeError extends StorageError {
  constructor() {
    super("bad_request", "File exceeds maximum size of 10 MB", 400);
    this.name = "FileTooLargeError";
  }
}

export class EmptyFileError extends StorageError {
  constructor() {
    super("bad_request", "File cannot be empty", 400);
    this.name = "EmptyFileError";
  }
}

export class FileNotFoundError extends StorageError {
  constructor() {
    super("not_found", "File not found", 404);
    this.name = "FileNotFoundError";
  }
}
