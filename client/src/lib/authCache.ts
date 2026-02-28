import { User } from '../types';
import { setAuthToken, userApi } from './api';

const STORAGE_KEYS = {
  TOKEN: 'authToken',
  USER: 'authUser',
  LAST_LOGIN: 'lastLoginTime',
};

export const authCache = {
  saveSession(token: string, user: User): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.LAST_LOGIN, new Date().toISOString());
      setAuthToken(token);
    } catch (error) {
      console.error('Failed to save auth session:', error);
    }
  },

  getToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch {
      return null;
    }
  },

  getSavedUser(): User | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      if (!raw) return null;
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  clearCredentials(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.LAST_LOGIN);
      setAuthToken(null);
    } catch (error) {
      console.error('Failed to clear auth session:', error);
    }
  },

  hasCredentials(): boolean {
    return Boolean(this.getToken());
  },

  getLastLoginTime(): Date | null {
    try {
      const lastLogin = localStorage.getItem(STORAGE_KEYS.LAST_LOGIN);
      return lastLogin ? new Date(lastLogin) : null;
    } catch {
      return null;
    }
  },

  async autoLogin(): Promise<{ user: User; token: string } | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      setAuthToken(token);
      const user = await userApi.getMe();
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.LAST_LOGIN, new Date().toISOString());
      return { user, token };
    } catch {
      this.clearCredentials();
      return null;
    }
  },

  shouldAutoLogin(): boolean {
    const lastLogin = this.getLastLoginTime();
    if (!lastLogin) return this.hasCredentials();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (lastLogin < thirtyDaysAgo) {
      this.clearCredentials();
      return false;
    }
    return this.hasCredentials();
  },
};
