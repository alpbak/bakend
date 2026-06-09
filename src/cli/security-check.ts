import { DEFAULT_AUTH_JWT_SECRET } from "../core/config/defaults.ts";
import type { BakendConfig } from "../core/config/types.ts";

const DEMO_SECRETS = new Set([
  DEFAULT_AUTH_JWT_SECRET,
  "todo-api-demo-change-me",
  "dev-only-change-me",
]);

export function warnIfInsecureProductionConfig(config: BakendConfig): void {
  if (process.env.BAKEND_ENV !== "production") {
    return;
  }

  if (DEMO_SECRETS.has(config.auth.jwtSecret)) {
    console.warn(
      "WARNING: auth.jwtSecret is a default/demo value. Set a strong secret before production use.",
    );
  }
}
