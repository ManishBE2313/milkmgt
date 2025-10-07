'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { authCache } from '@/lib/authCache';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const resetState = useStore((state) => state.resetState);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  useEffect(() => {
    // Redirect to home if no user
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  const handleLogout = (forgetMe: boolean = false) => {
    resetState();
    
    // Clear remembered credentials if "Forget Me" is selected
    if (forgetMe) {
      authCache.clearCredentials();
    }
    
    setShowLogoutMenu(false);
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const lastLogin = authCache.getLastLoginTime();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 
                className="text-2xl font-bold text-primary-600 cursor-pointer hover:text-primary-700"
                onClick={() => router.push('/dashboard')}
              >
                🥛 Milk Manager Plus
              </h1>
              
              {/* Customer Icon - NEW */}
              <button
                onClick={() => router.push('/dashboard/customers')}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-primary-100 dark:bg-primary-900 hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                title="Manage Customers"
              >
                <span className="text-xl">👥</span>
                <span className="text-sm font-medium text-primary-700 dark:text-primary-300 hidden sm:inline">
                  Customers
                </span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4 relative">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
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
                  Logout ▼
                </button>

                {/* Logout Dropdown Menu */}
                {showLogoutMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                    {authCache.hasCredentials() && (
                      <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        Auto-login is enabled
                      </div>
                    )}
                    <button
                      onClick={() => handleLogout(false)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      🚪 Logout (Keep Auto-login)
                    </button>
                    <button
                      onClick={() => handleLogout(true)}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      🔒 Logout & Forget Me
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Click outside to close dropdown */}
      {showLogoutMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowLogoutMenu(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            © 2025 Milk Manager Plus. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
