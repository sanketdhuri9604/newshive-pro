import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/shared/Navbar'
import BottomNav from '@/components/shared/BottomNav'
import AuthProvider from '@/components/shared/AuthProvider'
import { LangProvider } from '@/components/shared/LangProvider'
import AuthGuard from '@/components/shared/AuthGuard'

export const metadata: Metadata = {
  title: 'NewsHive Pro',
  description: 'Real news. AI clarity. No noise.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%238B5CF6'/><text y='.9em' font-size='75' x='12'>⚡</text></svg>",
    apple: '/icon-192.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NewsHive',
  },
  openGraph: {
    title: 'NewsHive Pro',
    description: 'AI-powered news platform',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#8B5CF6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NewsHive" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-mesh min-h-screen">
        <LangProvider>
          <AuthProvider>
            <AuthGuard>
              <Navbar />
              <main className="md:pl-14 pb-20 md:pb-0">
                {children}
              </main>
              <BottomNav />
            </AuthGuard>
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: 'toast-custom',
                style: {
                  background: 'rgba(13,13,32,0.95)',
                  color: '#F8F8FF',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontFamily: 'DM Sans, sans-serif',
                  borderRadius: '14px',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.1)',
                },
              }}
            />
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  )
}