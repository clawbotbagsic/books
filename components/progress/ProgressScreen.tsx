'use client'

// components/progress/ProgressScreen.tsx — Full-screen progress with status messages

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProgressStatus } from './ProgressStatus'
import { useBookGeneration } from '@/hooks/useBookGeneration'
import { Button } from '@/components/ui/Button'

interface ProgressScreenProps {
  bookUuid: string
}

export function ProgressScreen({ bookUuid }: ProgressScreenProps) {
  const router = useRouter()
  const { state, startGeneration } = useBookGeneration()

  // Start polling when the component mounts
  useEffect(() => {
    if (bookUuid) {
      startGeneration(bookUuid)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookUuid])

  // Navigate to reader when complete
  useEffect(() => {
    if (state.status === 'complete' && state.bookUuid) {
      router.push(`/book/${state.bookUuid}`)
    }
  }, [state.status, state.bookUuid, router])

  const totalPages = 10
  const progressPercent =
    state.pagesComplete > 0 ? Math.round((state.pagesComplete / totalPages) * 100) : 5

  if (state.status === 'error') {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-8 h-8 text-red-500"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">
            {state.errorMessage ?? 'An unexpected error occurred. Please try again.'}
          </p>
          <Button onClick={() => router.push('/')} aria-label="Go back to home page">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-6"
      aria-label="Book generation in progress"
    >
      {/* Illustration/animation area */}
      <div className="mb-10 flex items-center justify-center">
        {/* Decorative book icon that pulses */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-200 animate-ping opacity-20" />
          <div className="relative w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-10 h-10 text-amber-500"
              aria-hidden="true"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
        Creating your book
      </h1>
      <p className="text-gray-500 text-center mb-8 max-w-sm">
        This takes about 2 minutes. Don't close this tab.
      </p>

      {/* Status line */}
      <div className="mb-8">
        <ProgressStatus pagesComplete={state.pagesComplete} />
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div
          className="w-full h-2 bg-amber-200 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Book generation ${progressPercent}% complete`}
        >
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Page counter */}
      {state.pagesComplete > 0 && (
        <p className="mt-4 text-sm text-gray-500">
          {state.pagesComplete} of {totalPages} illustrations complete
        </p>
      )}
    </div>
  )
}
