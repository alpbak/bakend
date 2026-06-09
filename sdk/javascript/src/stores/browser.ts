import type { AuthStore } from "../types.ts";

const TOKEN_KEY = "bakend_token";
const REFRESH_KEY = "bakend_refresh_token";

function createBrowserAuthStore(storage: Storage): AuthStore {
  return {
    getToken: () => storage.getItem(TOKEN_KEY),
    setToken: (value) => storage.setItem(TOKEN_KEY, value),
    getRefreshToken: () => storage.getItem(REFRESH_KEY),
    setRefreshToken: (value) => storage.setItem(REFRESH_KEY, value),
    clear: () => {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(REFRESH_KEY);
    },
  };
}

export function createLocalStorageAuthStore(): AuthStore {
  return createBrowserAuthStore(localStorage);
}

export function createSessionStorageAuthStore(): AuthStore {
  return createBrowserAuthStore(sessionStorage);
}
