import { proxy } from "valtio";
import { getMe } from "@/api/legacyAuth";

import { type NeosStore } from "./shared";

const AUTH_TOKEN_KEY = "ygo_legacy_token";

export interface User {
  id: number;
  username: string;
  email: string;
  token: string;
  avatar_url?: string;
  // Compatibility fields for existing Neos code
  name?: string;
  external_id?: number;
}

class AccountStore implements NeosStore {
  user?: User;
  isLoading: boolean = false;
  isInitialized: boolean = false;

  login(user: User) {
    // Ensure name is set for compatibility
    this.user = {
      ...user,
      name: user.name || user.username
    };
    // Persist token to localStorage
    localStorage.setItem(AUTH_TOKEN_KEY, user.token);
  }

  logout() {
    this.user = undefined;
    // Remove token from localStorage
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  reset(): void {
    this.user = undefined;
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  // Load user from localStorage token on app init
  async loadFromStorage(): Promise<boolean> {
    if (this.isInitialized) return !!this.user;

    this.isLoading = true;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      this.isLoading = false;
      this.isInitialized = true;
      return false;
    }

    try {
      // Validate token with backend
      const user = await getMe(token);
      if (user) {
        this.user = {
          ...user,
          name: user.name || user.username
        };
        this.isLoading = false;
        this.isInitialized = true;
        return true;
      } else {
        // Token invalid, remove it
        localStorage.removeItem(AUTH_TOKEN_KEY);
        this.isLoading = false;
        this.isInitialized = true;
        return false;
      }
    } catch {
      // Error validating, remove token
      localStorage.removeItem(AUTH_TOKEN_KEY);
      this.isLoading = false;
      this.isInitialized = true;
      return false;
    }
  }

  get isAuthenticated(): boolean {
    return !!this.user;
  }
}

export const accountStore = proxy(new AccountStore());
