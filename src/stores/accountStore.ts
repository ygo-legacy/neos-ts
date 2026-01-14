import { proxy } from "valtio";

import { type NeosStore } from "./shared";

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

  login(user: User) {
    // Ensure name is set for compatibility
    this.user = {
      ...user,
      name: user.name || user.username
    };
  }

  logout() {
    this.user = undefined;
  }

  reset(): void {
    this.user = undefined;
  }
}

export const accountStore = proxy(new AccountStore());
