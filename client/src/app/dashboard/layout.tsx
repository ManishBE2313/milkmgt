'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { authCache } from '@/lib/authCache';
import { setAuthToken } from '@/lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const token = useStore((state) => state.token);
  const setUser = useStore((state) => state.setUser);
  const setToken = useStore((state) => state.setToken);
  const resetState = useStore((state) => state.resetState);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const bootstrapSession = async () => {
      if (user) {
        setCheckingSession(false);
        return;
      }

      const session = await authCache.autoLogin();
      if (session) {
        setUser(session.user);
        setToken(session.token);
        setAuthToken(session.token);
        setCheckingSession(false);
        return;
      }

      setCheckingSession(false);
      router.push('/');
    };

    bootstrapSession();
  }, [router, setToken, setUser, user]);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  const handleLogout = (forgetMe: boolean = false) => {
    resetState();

    if (forgetMe) {
      authCache.clearCredentials();
    }

    setShowLogoutMenu(false);
    router.push('/');
  };

  if (checkingSession || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const lastLogin = authCache.getLastLoginTime();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 px-4 pt-4 sm:px-6">
        <div className="mx-auto max-w-7xl card !py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                className="text-left"
                onClick={() => router.push('/dashboard')}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-primary-600">Milk Manager Plus</p>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Operations Dashboard
                </h1>
              </button>
              <button
                onClick={() => router.push('/dashboard/customers')}
                className="btn-secondary btn-sm hidden sm:inline-flex"
                title="Manage Customers"
              >
                Customers
              </button>
            </div>

            <div className="flex items-center space-x-3 relative">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {user.fullname}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  @{user.username}
                </p>
                {lastLogin && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Last login: {new Date(lastLogin).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowLogoutMenu(!showLogoutMenu)}
                  className="btn-secondary btn-sm"
                >
                  Sign Out
                </button>

                {showLogoutMenu && (
                  <div className="absolute right-0 mt-2 w-60 card !p-2 z-30">
                    {authCache.hasCredentials() && (
                      <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        Auto-login is currently enabled
                      </div>
                    )}
                    <button
                      onClick={() => handleLogout(false)}
                      className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-white/45 dark:hover:bg-white/10"
                    >
                      Sign out and keep auto-login
                    </button>
                    <button
                      onClick={() => handleLogout(true)}
                      className="w-full text-left px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-white/45 dark:hover:bg-white/10"
                    >
                      Sign out and forget credentials
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {showLogoutMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowLogoutMenu(false)}
        ></div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6">{children}</main>

      <footer className="px-4 pb-6 sm:px-6">
        <div className="mx-auto max-w-7xl card !py-5">
          <p className="text-center text-sm text-gray-700 dark:text-gray-300">
            Powered by Manish
          </p>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            singhmanish231301@gmail.com
          </p>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            Milk Manager Plus
          </p>
        </div>
      </footer>
    </div>
  );
}
