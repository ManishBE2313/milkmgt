import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Milk Manager Plus',
  description: 'Smart Milk Tracking App with PostgreSQL Integration',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-blue-300/35 blur-3xl dark:bg-blue-700/25"></div>
          <div className="pointer-events-none absolute -bottom-24 -right-14 h-80 w-80 rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-700/25"></div>
          <div className="pointer-events-none absolute top-1/3 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-white/45 blur-3xl dark:bg-slate-400/10"></div>
          {children}
        </div>
      </body>
    </html>
  );
}
