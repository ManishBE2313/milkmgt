'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { userApi } from '@/lib/api';
import { authCache } from '@/lib/authCache';

export default function HomePage() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  
  const [formData, setFormData] = useState({
    username: '',
    fullname: '',
    address: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Auto-login on app start
  useEffect(() => {
    const performAutoLogin = async () => {
      // Check if user already exists in Zustand store
      if (user) {
        console.log('✅ User already logged in from store');
        router.push('/dashboard');
        return;
      }

      // Attempt auto-login if credentials are cached
      if (authCache.shouldAutoLogin()) {
        console.log('🔄 Starting auto-login...');
        
        const loggedInUser = await authCache.autoLogin();
        
        if (loggedInUser) {
          setUser(loggedInUser);
          router.push('/dashboard');
          return;
        }
      }

      // No auto-login, load form with saved credentials if available
      const savedCredentials = authCache.getSavedCredentials();
      if (savedCredentials) {
        setFormData(savedCredentials);
        setRememberMe(true);
      }
      
      setCheckingAuth(false);
    };

    performAutoLogin();
  }, [user, router, setUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.username || !formData.fullname || !formData.address) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    
    try {
      const userData = await userApi.createOrGetUser(formData);
      setUser(userData);

      // Save or clear credentials based on "Remember Me" checkbox
      if (rememberMe) {
        authCache.saveCredentials(formData);
      } else {
        authCache.clearCredentials();
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to enter app');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="spinner mx-auto" style={{ width: '3rem', height: '3rem' }}></div>
          <p className="text-gray-600 dark:text-gray-400">🔍 Checking for saved credentials...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Auto-login in progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">
            🥛 Milk Manager Plus
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Smart Milk Tracking & Billing System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="input"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label htmlFor="fullname" className="block text-sm font-medium mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="fullname"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              className="input"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-2">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="input"
              rows={3}
              placeholder="Enter your address"
              required
            />
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label
              htmlFor="rememberMe"
              className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
            >
              Remember Me (Auto-login on next visit)
            </label>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full btn-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="spinner mr-2"></span>
                Loading...
              </span>
            ) : (
              'Enter App'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>No signup required • Your data is private</p>
          {authCache.hasCredentials() && (
            <p className="mt-2 text-xs text-primary-600 dark:text-primary-400">
              ✓ Credentials saved - Auto-login enabled
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
