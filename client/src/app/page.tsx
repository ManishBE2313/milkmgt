'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { authApi, setAuthToken } from '@/lib/api';
import { authCache } from '@/lib/authCache';

type AuthMode = 'login' | 'register';

export default function HomePage() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const setToken = useStore((state) => state.setToken);

  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    username: '',
    fullname: '',
    address: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const performAutoLogin = async () => {
      if (user) {
        router.push('/dashboard');
        return;
      }

      if (authCache.shouldAutoLogin()) {
        const session = await authCache.autoLogin();
        if (session) {
          setUser(session.user);
          setToken(session.token);
          setAuthToken(session.token);
          router.push('/dashboard');
          return;
        }
      }

      setCheckingAuth(false);
    };

    performAutoLogin();
  }, [router, setToken, setUser, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Username and password are required');
      return;
    }
    if (mode === 'register' && (!formData.fullname || !formData.address)) {
      setError('Full name and address are required for registration');
      return;
    }

    setLoading(true);

    try {
      const authData =
        mode === 'register'
          ? await authApi.register(formData)
          : await authApi.login({
              username: formData.username,
              password: formData.password,
            });

      setUser(authData.user);
      setToken(authData.token);
      setAuthToken(authData.token);

      if (rememberMe) {
        authCache.saveSession(authData.token, authData.user);
      } else {
        authCache.clearCredentials();
        setAuthToken(authData.token);
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
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

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="spinner mx-auto" style={{ width: '3rem', height: '3rem' }}></div>
          <p className="text-gray-600 dark:text-gray-400">Checking saved session...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Auto-login in progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        <div className="card mb-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600">
            Milk Management Suite
          </p>
          <h1 className="mt-3 text-4xl font-bold text-gray-900 dark:text-gray-100">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {mode === 'login'
              ? 'Sign in to manage deliveries, billing and analytics.'
              : 'Register your account to start tracking milk operations.'}
          </p>
        </div>

        <div className="card">
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/30 dark:bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={mode === 'login' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={mode === 'register' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
            >
              Register
            </button>
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

            {mode === 'register' && (
              <>
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
              </>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input"
                placeholder="Minimum 8 characters"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                Keep me signed in
              </label>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-100/70 dark:bg-red-900/60 text-red-700 dark:text-red-200 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full btn-lg">
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="spinner mr-2"></span>
                  Processing...
                </span>
              ) : mode === 'login' ? (
                'Login'
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
