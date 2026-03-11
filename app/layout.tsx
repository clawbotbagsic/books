import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SessionProvider } from '@/context/SessionContext'
import { GearIcon } from '@/components/settings/GearIcon'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://books.tunedfor.ai'),
  title: 'Story Spark — A personalized book, just for them',
  description:
    'Generate a personalized, illustrated children\'s book in under 3 minutes. Tailored to your child\'s name, age, and reading level.',
  openGraph: {
    title: 'Story Spark — A personalized book, just for them',
    description: 'Personalized illustrated children\'s books, generated instantly.',
    images: ['/og-image.png'],
    siteName: 'Story Spark',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
          <GearIcon />
        </SessionProvider>
      </body>
    </html>
  )
}
