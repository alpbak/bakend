export interface AuthUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

export interface ValidationDetail {
  field: string;
  rule: string;
  message: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: ValidationDetail[];
  };
}

export type RecordData = Record<string, unknown>;

export interface ListResult<T = RecordData> {
  items: T[];
}

export type FileVisibility = "public" | "protected";

export interface FileMetadata {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  visibility: FileVisibility;
  userId: string;
  createdAt: string;
}

export interface UploadOptions {
  visibility?: FileVisibility;
  filename?: string;
}

export interface BakendEvent {
  id: string;
  type: string;
  timestamp: string;
  source: string;
  payload: unknown;
}

export type RealtimeEventHandler = (event: BakendEvent) => void;

export interface AuthStore {
  getToken(): string | null;
  setToken(token: string): void;
  getRefreshToken(): string | null;
  setRefreshToken(token: string): void;
  clear(): void;
}

export interface BakendClientOptions {
  authStore?: AuthStore;
  autoRefresh?: boolean;
}

export interface HttpClient {
  request<T>(path: string, init?: RequestInit, skipAuth?: boolean): Promise<T>;
  getBaseUrl(): string;
  getToken(): string | null;
}
