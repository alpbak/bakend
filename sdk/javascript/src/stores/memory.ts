import type { AuthStore } from "../types.ts";

export function createMemoryAuthStore(): AuthStore {
  let token: string | null = null;
  let refreshToken: string | null = null;

  return {
    getToken: () => token,
    setToken: (value) => {
      token = value;
    },
    getRefreshToken: () => refreshToken,
    setRefreshToken: (value) => {
      refreshToken = value;
    },
    clear: () => {
      token = null;
      refreshToken = null;
    },
  };
}
