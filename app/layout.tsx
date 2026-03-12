import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SessionProvider } from '@/context/SessionContext'
import { GearIcon } from '@/components/settings/GearIcon'
import { Fredoka, Caveat, Nunito } from 'next/font/google'

const fredokaOne = Fredoka({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-fredoka',
  display: 'swap',
})

const caveat = Caveat({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
})

const nunito = Nunito({
  weight: ['400', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://books.tunedfor.ai'),
  title: 'Inklings — A book made just for them',
  description:
    'Personalized illustrated children\'s books generated in under 3 minutes. Tailored to your child\'s name, age, and reading level.',
  openGraph: {
    title: 'Inklings — A book made just for them',
    description: 'Personalized illustrated children\'s books, generated instantly.',
    images: ['/og-image.png'],
    siteName: 'Inklings',
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
    <html
      lang="en"
      className={`${fredokaOne.variable} ${caveat.variable} ${nunito.variable}`}
    >
      <body>
        <SessionProvider>
          {children}
          <GearIcon />
        </SessionProvider>
      </body>
    </html>
  )
}
