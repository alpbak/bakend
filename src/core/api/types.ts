import type { ValidationError } from "../collections/types.ts";

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: ValidationError[];
}

export interface ApiErrorResponse {
  error: ApiErrorBody;
}

export interface ListRecordsResponse {
  items: Record<string, unknown>[];
}
