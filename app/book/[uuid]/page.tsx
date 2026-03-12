// app/book/[uuid]/page.tsx — Book reader: loads completed book by UUID

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookReader } from '@/components/reader/BookReader'
import { Button } from '@/components/ui/Button'
import type { BookRecord } from '@/types/index'
import type { Metadata } from 'next'

interface PageProps {
  params: { uuid: string }
}

async function getBook(uuid: string): Promise<BookRecord | null | 'expired'> {
  try {
    // Use absolute URL for server-side fetch in Next.js
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/book/${uuid}`, {
      cache: 'no-store', // Always fresh for the reader
    })

    if (res.status === 404) return null
    if (res.status === 410) return 'expired'
    if (!res.ok) return null

    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const book = await getBook(params.uuid)

  if (!book || book === 'expired') {
    return { title: 'Inklings' }
  }

  return {
    title: `${book.childName}'s Story — Inklings`,
    description: `A personalized illustrated book: ${book.theme}`,
  }
}

export default async function BookPage({ params }: PageProps) {
  const { uuid } = params
  const book = await getBook(uuid)

  // Expired
  if (book === 'expired') {
    return (
      <main className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 text-amber-500"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">This book has expired</h1>
          <p className="text-gray-600 mb-6">
            Inklings books live for 30 days. This one has passed its expiry date.
          </p>
          <Link href="/">
            <Button aria-label="Create a new book">Create a New Book</Button>
          </Link>
        </div>
      </main>
    )
  }

  // Not found
  if (!book) {
    notFound()
  }

  // Still generating — show a waiting state
  if (book.status === 'generating') {
    return (
      <main className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {book.childName}&apos;s book is still being created
          </h1>
          <p className="text-gray-600 mb-6">
            {book.pages_complete} of {book.pages.length} illustrations complete. Check back in a
            moment.
          </p>
          <Link href={`/generating?uuid=${uuid}`}>
            <Button aria-label="View progress">View Progress</Button>
          </Link>
        </div>
      </main>
    )
  }

  // Failed
  if (book.status === 'failed') {
    return (
      <main className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            This book couldn&apos;t be created
          </h1>
          <p className="text-gray-600 mb-6">
            Something went wrong during generation. Please try creating a new book.
          </p>
          <Link href="/">
            <Button aria-label="Try creating a new book">Try Again</Button>
          </Link>
        </div>
      </main>
    )
  }

  // Complete — show the reader
  return <BookReader book={book} />
}
