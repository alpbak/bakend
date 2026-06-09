import { parseDuration } from "./duration.ts";
import type { AuthUser } from "./types.ts";

interface JwtPayload {
  sub: string;
  role: string;
  exp: number;
  iat: number;
}

function base64UrlEncode(data: Uint8Array | string): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(data: string, secret: string): Promise<string> {
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64UrlEncode(new Uint8Array(signature));
}

async function verifySignature(data: string, signature: string, secret: string): Promise<boolean> {
  const key = await importKey(secret);
  return crypto.subtle.verify(
    "HMAC",
    key,
    new Uint8Array(base64UrlDecode(signature)),
    new TextEncoder().encode(data),
  );
}

export async function issueAccessToken(
  user: AuthUser,
  secret: string,
  ttl: string,
): Promise<string> {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: user.id,
    role: user.role,
    exp: now + Math.floor(parseDuration(ttl) / 1000),
    iat: now,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${header}.${encodedPayload}`;
  const signature = await sign(signingInput, secret);
  return `${signingInput}.${signature}`;
}

export async function verifyAccessToken(
  token: string,
  secret: string,
): Promise<AuthUser | null> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [header, payload, signature] = parts;
  if (!header || !payload || !signature) {
    return null;
  }

  const signingInput = `${header}.${payload}`;
  const valid = await verifySignature(signingInput, signature, secret);
  if (!valid) {
    return null;
  }

  try {
    const decoded = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload))) as JwtPayload;
    if (typeof decoded.sub !== "string" || typeof decoded.role !== "string") {
      return null;
    }

    if (typeof decoded.exp !== "number" || decoded.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: decoded.sub,
      email: "",
      role: decoded.role as AuthUser["role"],
      createdAt: "",
    };
  } catch {
    return null;
  }
}
