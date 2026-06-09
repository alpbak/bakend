import type { AuthContext } from "../auth/types.ts";
import type { FileMetadata } from "./types.ts";

export function canReadFile(file: FileMetadata, authContext: AuthContext | null): boolean {
  if (file.visibility === "public") {
    return true;
  }

  if (!authContext) {
    return false;
  }

  if (authContext.user.role === "admin") {
    return true;
  }

  return file.userId === authContext.user.id;
}

export function canDeleteFile(file: FileMetadata, authContext: AuthContext | null): boolean {
  if (!authContext) {
    return false;
  }

  if (authContext.user.role === "admin") {
    return true;
  }

  return file.userId === authContext.user.id;
}
