import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/header'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@vercel/analytics/next'
import { config } from '@/lib/config'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: config.siteName,
    template: `%s | ${config.siteName}`,
  },
  description: 'Consultez les webcams en direct et les prévisions de surf pour les meilleurs spots de France.',
  keywords: ['surf', 'webcam', 'prévisions', 'vagues', 'météo marine', 'spots de surf'],
  authors: [{ name: config.siteName }],
  creator: config.siteName,
  metadataBase: new URL(config.siteUrl),
  openGraph: {
    type: 'website',
    locale: config.locale,
    url: config.siteUrl,
    title: config.siteName,
    description: 'Consultez les webcams en direct et les prévisions de surf pour les meilleurs spots de France.',
    siteName: config.siteName,
  },
  twitter: {
    card: 'summary_large_image',
    title: config.siteName,
    description: 'Consultez les webcams en direct et les prévisions de surf pour les meilleurs spots de France.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang={config.locale} suppressHydrationWarning>
      <body className={inter.className}>
        <div className="relative min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border py-6 md:py-8">
            <div className="container text-center text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} {config.siteName}. Tous droits réservés.</p>
            </div>
          </footer>
        </div>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
