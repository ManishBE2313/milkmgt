import { userApi } from './api';
import { User } from '../types';

const STORAGE_KEYS = {
  USERNAME: 'rememberedUsername',
  FULLNAME: 'rememberedFullname',
  ADDRESS: 'rememberedAddress',
  LAST_LOGIN: 'lastLoginTime',
};

interface SavedCredentials {
  username: string;
  fullname: string;
  address: string;
}

/**
 * Auth Cache Manager - Handles credential caching and auto-login
 */
export const authCache = {
  /**
   * Save user credentials to localStorage
   */
  saveCredentials(credentials: SavedCredentials): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USERNAME, credentials.username);
      localStorage.setItem(STORAGE_KEYS.FULLNAME, credentials.fullname);
      localStorage.setItem(STORAGE_KEYS.ADDRESS, credentials.address);
      localStorage.setItem(STORAGE_KEYS.LAST_LOGIN, new Date().toISOString());
      console.log('✅ Credentials saved to cache');
    } catch (error) {
      console.error('Failed to save credentials:', error);
    }
  },

  /**
   * Get saved credentials from localStorage
   */
  getSavedCredentials(): SavedCredentials | null {
    try {
      const username = localStorage.getItem(STORAGE_KEYS.USERNAME);
      const fullname = localStorage.getItem(STORAGE_KEYS.FULLNAME);
      const address = localStorage.getItem(STORAGE_KEYS.ADDRESS);

      if (username && fullname && address) {
        return { username, fullname, address };
      }
      return null;
    } catch (error) {
      console.error('Failed to get saved credentials:', error);
      return null;
    }
  },

  /**
   * Clear all saved credentials from localStorage
   */
  clearCredentials(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.USERNAME);
      localStorage.removeItem(STORAGE_KEYS.FULLNAME);
      localStorage.removeItem(STORAGE_KEYS.ADDRESS);
      localStorage.removeItem(STORAGE_KEYS.LAST_LOGIN);
      console.log('✅ Credentials cleared from cache');
    } catch (error) {
      console.error('Failed to clear credentials:', error);
    }
  },

  /**
   * Check if credentials exist in cache
   */
  hasCredentials(): boolean {
    const credentials = this.getSavedCredentials();
    return credentials !== null;
  },

  /**
   * Get last login time
   */
  getLastLoginTime(): Date | null {
    try {
      const lastLogin = localStorage.getItem(STORAGE_KEYS.LAST_LOGIN);
      return lastLogin ? new Date(lastLogin) : null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Auto-login using cached credentials
   * Returns user data if successful, null otherwise
   */
  async autoLogin(): Promise<User | null> {
    const credentials = this.getSavedCredentials();
    
    if (!credentials) {
      console.log('❌ No cached credentials found');
      return null;
    }

    console.log('🔄 Attempting auto-login for:', credentials.username);

    try {
      const user = await userApi.createOrGetUser(credentials);
      
      // Update last login time
      localStorage.setItem(STORAGE_KEYS.LAST_LOGIN, new Date().toISOString());
      
      console.log('✅ Auto-login successful:', user.username);
      return user;
    } catch (error) {
      console.error('❌ Auto-login failed:', error);
      
      // Clear invalid credentials
      this.clearCredentials();
      return null;
    }
  },

  /**
   * Check if auto-login should be attempted
   * (can add time-based expiry logic here)
   */
  shouldAutoLogin(): boolean {
    const lastLogin = this.getLastLoginTime();
    
    if (!lastLogin) {
      return this.hasCredentials();
    }

    // Optional: Add expiry logic (e.g., 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (lastLogin < thirtyDaysAgo) {
      console.log('⚠️ Credentials expired (30+ days old)');
      this.clearCredentials();
      return false;
    }

    return this.hasCredentials();
  },
};
