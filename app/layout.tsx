import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/shared/Navbar'
import AuthProvider from '@/components/shared/AuthProvider'
import { LangProvider } from '@/components/shared/LangProvider'


export const metadata: Metadata = {
  title: 'NewsHive Pro',                    // ← ye bhi change karo
  description: 'Real news. AI clarity. No noise.',
  icons: {                                   // ← ye add karo
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%238B5CF6'/><text y='.9em' font-size='75' x='12'>⚡</text></svg>",
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
      <body className="bg-mesh min-h-screen">
        <LangProvider>
        <AuthProvider>
          <Navbar />
         
          <main className="md:pl-14">
            {children}
          </main>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#111124',
                color: '#F0F0FF',
                border: '1px solid #1e1e3a',
                fontFamily: 'DM Sans, sans-serif',
              },
            }}
          />
        </AuthProvider>
        </LangProvider>
      </body>
    </html>
  )
}
