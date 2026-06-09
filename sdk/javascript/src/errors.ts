import type { ValidationDetail } from "./types.ts";

export class BakendError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: ValidationDetail[];

  constructor(code: string, message: string, status: number, details?: ValidationDetail[]) {
    super(message);
    this.name = "BakendError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
