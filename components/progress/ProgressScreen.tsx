'use client'

// components/progress/ProgressScreen.tsx — Animated progress with live illustration thumbnails

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBookGeneration } from '@/hooks/useBookGeneration'
import { Button } from '@/components/ui/Button'

interface ProgressScreenProps {
  bookUuid: string
}

// Rotating fun messages shown during story writing phase
function getWritingMessages(childName: string, theme: string): string[] {
  const name = childName || 'your hero'
  const themeWord = theme || 'adventure'
  return [
    `Writing ${name}'s story...`,
    `Giving ${name} a catchphrase...`,
    `Planning the big "${themeWord}" adventure...`,
    `Writing the "OH NO!" moment...`,
    `Making sure ${name} saves the day...`,
    `Adding the twist no one sees coming...`,
    `Teaching ${name} how to be brave...`,
    `Making the ending extra triumphant...`,
    `Picking just the right words...`,
    `Double-checking the hero's hair looks good...`,
  ]
}

function WritingPhase({ childName, theme }: { childName: string; theme: string }) {
  const messages = getWritingMessages(childName, theme)
  const [msgIndex, setMsgIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out, swap, fade in
      setVisible(false)
      setTimeout(() => {
        setMsgIndex(i => (i + 1) % messages.length)
        setVisible(true)
      }, 300)
    }, 3000)
    return () => clearInterval(interval)
  }, [messages.length])

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Animated book + sparkles */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Outer ping ring */}
        <div className="absolute inset-0 rounded-full bg-amber-300 animate-ping opacity-10" />
        {/* Inner glow */}
        <div className="absolute inset-4 rounded-full bg-amber-200 opacity-40 animate-pulse" />
        {/* Book icon */}
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shadow-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-12 h-12 text-amber-600"
            aria-hidden="true"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>
        {/* Orbiting sparkle dots */}
        <SparkleOrbit />
      </div>

      {/* Rotating message */}
      <div className="h-8 flex items-center justify-center">
        <p
          className="text-lg text-amber-700 font-medium text-center transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
          aria-live="polite"
          aria-atomic="true"
        >
          {messages[msgIndex]}
        </p>
      </div>
    </div>
  )
}

// Pure CSS orbiting sparkles — no dependencies
function SparkleOrbit() {
  return (
    <>
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <div
          key={i}
          className="absolute w-2.5 h-2.5"
          style={{
            top: '50%',
            left: '50%',
            transformOrigin: '0 0',
            animation: `orbit-${i % 2 === 0 ? 'cw' : 'ccw'} ${3 + i * 0.4}s linear infinite`,
            transform: `rotate(${deg}deg) translateX(52px) translateY(-5px)`,
          }}
        >
          <div
            className="w-2 h-2 rounded-full bg-amber-400 opacity-80"
            style={{ animation: `pulse-dot ${1.5 + i * 0.2}s ease-in-out infinite alternate` }}
          />
        </div>
      ))}
      {/* Keyframes injected inline */}
      <style>{`
        @keyframes orbit-cw  { from { transform: rotate(var(--start, 0deg)) translateX(52px) translateY(-5px); } to { transform: rotate(calc(var(--start, 0deg) + 360deg)) translateX(52px) translateY(-5px); } }
        @keyframes orbit-ccw { from { transform: rotate(var(--start, 0deg)) translateX(52px) translateY(-5px); } to { transform: rotate(calc(var(--start, 0deg) - 360deg)) translateX(52px) translateY(-5px); } }
        @keyframes pulse-dot  { from { opacity: 0.4; transform: scale(0.7); } to { opacity: 1; transform: scale(1.2); } }
        @keyframes pop-in     { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </>
  )
}

function ThumbnailGrid({
  totalPages,
  imageUrls,
  pagesComplete,
}: {
  totalPages: number
  imageUrls: (string | null)[]
  pagesComplete: number
}) {
  // Responsive grid: 5 cols on wide, 4 on narrow
  const cols = totalPages <= 16 ? 4 : 5

  return (
    <div
      className="grid gap-2 w-full max-w-sm"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      aria-label="Illustration progress"
    >
      {Array.from({ length: totalPages }).map((_, i) => {
        const url = imageUrls[i] ?? null
        const isReady = Boolean(url)
        return (
          <div
            key={i}
            className="aspect-square rounded-lg overflow-hidden relative"
            style={
              isReady
                ? { animation: 'pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both' }
                : undefined
            }
          >
            {isReady ? (
              <img
                src={url!}
                alt={`Page ${i + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-amber-100 animate-pulse flex items-center justify-center">
                <span className="text-xs text-amber-300 font-bold">{i + 1}</span>
              </div>
            )}
            {/* Page number badge on filled thumbnails */}
            {isReady && (
              <div className="absolute bottom-0.5 right-0.5 bg-black/50 text-white text-[9px] rounded px-1 leading-4">
                {i + 1}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ProgressScreen({ bookUuid }: ProgressScreenProps) {
  const router = useRouter()
  const { state, startGeneration } = useBookGeneration()

  useEffect(() => {
    if (bookUuid) startGeneration(bookUuid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookUuid])

  useEffect(() => {
    if (state.status === 'complete' && state.bookUuid) {
      router.push(`/book/${state.bookUuid}`)
    }
  }, [state.status, state.bookUuid, router])

  const totalPages = state.totalPages || 14  // fallback to tier-2 default until first poll
  const progressPercent =
    state.status === 'writing'
      ? 5
      : state.pagesComplete > 0
        ? Math.round((state.pagesComplete / totalPages) * 100)
        : 5

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

  const isWriting = state.status === 'writing' || state.pagesComplete === 0
  const isIllustrating = state.pagesComplete > 0 && state.status !== 'complete'

  return (
    <div
      className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-6 gap-8"
      aria-label="Book generation in progress"
    >
      {/* Heading */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Creating your book</h1>
        <p className="text-gray-500 text-sm">This takes about 2 minutes. Don&apos;t close this tab.</p>
      </div>

      {/* Phase content */}
      {isWriting ? (
        <WritingPhase childName={state.childName} theme={state.theme} />
      ) : isIllustrating ? (
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          <p className="text-amber-700 font-medium text-sm" aria-live="polite">
            ✨ Illustrating page {state.pagesComplete} of {totalPages}...
          </p>
          <ThumbnailGrid
            totalPages={totalPages}
            imageUrls={state.imageUrls}
            pagesComplete={state.pagesComplete}
          />
        </div>
      ) : null}

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>{isWriting ? 'Writing story' : 'Creating illustrations'}</span>
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
            className="h-full bg-amber-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}
