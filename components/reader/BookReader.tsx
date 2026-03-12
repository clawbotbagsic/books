'use client'

// components/reader/BookReader.tsx — Root reader: page state, keyboard/swipe navigation

import { useState, useEffect, useCallback, useRef } from 'react'
import { BookPage } from './BookPage'
import { PageCounter } from './PageCounter'
import { ShareBanner } from './ShareBanner'
import { Button } from '@/components/ui/Button'
import type { BookRecord } from '@/types/index'

interface BookReaderProps {
  book: BookRecord
}

export function BookReader({ book }: BookReaderProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = book.pages.length
  const isLastPage = currentPage === totalPages
  const isFirstPage = currentPage === 1

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const goNext = useCallback(() => {
    setCurrentPage(p => Math.min(p + 1, totalPages))
  }, [totalPages])

  const goPrev = useCallback(() => {
    setCurrentPage(p => Math.max(p - 1, 1))
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev])

  // Swipe detection
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return

      const dx = e.changedTouches[0].clientX - touchStartX.current
      const dy = e.changedTouches[0].clientY - touchStartY.current

      // Only register as a horizontal swipe if horizontal movement dominates
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx < 0) goNext() // swipe left → next
        if (dx > 0) goPrev() // swipe right → prev
      }

      touchStartX.current = null
      touchStartY.current = null
    },
    [goNext, goPrev]
  )

  // Tap zone navigation (tap left third → prev, right third → next)
  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const width = e.currentTarget.offsetWidth
      const x = e.clientX - e.currentTarget.getBoundingClientRect().left
      const ratio = x / width

      if (ratio < 0.33) goPrev()
      else if (ratio > 0.67) goNext()
    },
    [goNext, goPrev]
  )

  const currentPageData = book.pages[currentPage - 1]

  return (
    <div
      className="flex flex-col h-screen bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Book title bar */}
      <div className="flex-none flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/90 backdrop-blur-sm">
        <div>
          <h1 className="text-sm font-semibold text-white leading-tight">
            {book.childName}&apos;s Story
          </h1>
          <p className="text-xs text-white/60">{book.theme}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Home link */}
          <a
            href="/"
            className="text-xs text-amber-400 hover:text-amber-300 font-medium px-2 py-1"
            aria-label="Create a new book"
          >
            Create new book
          </a>
        </div>
      </div>

      {/* Main page area — tappable */}
      <div
        className="flex-1 min-h-0 flex flex-col relative select-none cursor-pointer"
        onClick={handleTap}
        role="main"
        aria-label={`Book reader, page ${currentPage} of ${totalPages}`}
      >
        {currentPageData && (
          <BookPage
            pageNumber={currentPage}
            totalPages={totalPages}
            text={currentPageData.text}
            imageUrl={currentPageData.image_url}
            childName={book.childName}
          />
        )}

        {/* Left/right nav arrows (always visible for accessibility) */}
        <button
          onClick={e => { e.stopPropagation(); goPrev() }}
          disabled={isFirstPage}
          aria-label="Previous page"
          className={[
            'absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11',
            'flex items-center justify-center rounded-full',
            'bg-black/50 shadow-md border border-white/20 backdrop-blur-sm',
            'transition-opacity duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
            isFirstPage ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-black/70',
          ].join(' ')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-white"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          onClick={e => { e.stopPropagation(); goNext() }}
          disabled={isLastPage}
          aria-label="Next page"
          className={[
            'absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11',
            'flex items-center justify-center rounded-full',
            'bg-black/50 shadow-md border border-white/20 backdrop-blur-sm',
            'transition-opacity duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
            isLastPage ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-black/70',
          ].join(' ')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-white"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Bottom bar: page counter + share banner on last page */}
      <div className="flex-none px-4 py-3 border-t border-white/10 bg-black/90 backdrop-blur-sm">
        {isLastPage ? (
          <div className="flex flex-col gap-3 items-center">
            <ShareBanner bookUuid={book.uuid} />
            <div className="flex items-center justify-between w-full">
              <Button
                onClick={goPrev}
                variant="ghost"
                size="sm"
                aria-label="Go back to previous page"
              >
                Back
              </Button>
              <PageCounter currentPage={currentPage} totalPages={totalPages} />
              <div className="w-16" aria-hidden="true" /> {/* balance */}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <PageCounter currentPage={currentPage} totalPages={totalPages} />
          </div>
        )}
      </div>
    </div>
  )
}
