export const USER_ROLES = ["admin", "authenticated", "public"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuthContext {
  user: AuthUser;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

export interface AuthEngine {
  register(email: string, password: string): Promise<AuthTokens>;
  login(email: string, password: string): Promise<AuthTokens>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  logout(refreshToken: string): Promise<void>;
  validateAccessToken(token: string): Promise<AuthUser | null>;
  resolveAuthContext(request: Request): Promise<AuthContext | null>;
}

export class AuthError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
  }
}

export class DuplicateEmailError extends AuthError {
  constructor() {
    super("conflict", "Email is already registered", 409);
    this.name = "DuplicateEmailError";
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor() {
    super("unauthorized", "Invalid email or password", 401);
    this.name = "InvalidCredentialsError";
  }
}

export class InvalidTokenError extends AuthError {
  constructor(message = "Invalid or expired token") {
    super("unauthorized", message, 401);
    this.name = "InvalidTokenError";
  }
}
