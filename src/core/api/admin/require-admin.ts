import type { AuthContext } from "../../auth/types.ts";
import { forbiddenResponse, unauthorizedResponse } from "../responses.ts";

export function requireAdmin(authContext: AuthContext | null): Response | null {
  if (!authContext) {
    return unauthorizedResponse("Authentication required");
  }

  if (authContext.user.role !== "admin") {
    return forbiddenResponse("Admin access required");
  }

  return null;
}
