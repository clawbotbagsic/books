'use client'

// components/reader/ShareBanner.tsx — "Save this link" banner with copy-to-clipboard

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'

interface ShareBannerProps {
  bookUuid: string
}

export function ShareBanner({ bookUuid }: ShareBannerProps) {
  const [copied, setCopied] = useState(false)

  const bookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/book/${bookUuid}`
      : `/book/${bookUuid}`

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(bookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback: select the URL text
      const el = document.getElementById('share-url')
      if (el) {
        const range = document.createRange()
        range.selectNodeContents(el)
        const selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    }
  }, [bookUrl])

  return (
    <div className="mx-auto w-full max-w-lg bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col gap-3 text-center">
      <div className="flex items-center justify-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-amber-600"
          aria-hidden="true"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <p className="font-semibold text-gray-800">Save this link</p>
      </div>

      <p className="text-sm text-gray-600">
        Your book lives here for 30 days. Copy the link to come back anytime.
      </p>

      {/* URL display */}
      <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-500 break-all">
        <span id="share-url">{bookUrl}</span>
      </div>

      <Button
        onClick={handleCopy}
        variant={copied ? 'secondary' : 'primary'}
        className="w-full"
        aria-label="Copy book link to clipboard"
      >
        {copied ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy Link
          </>
        )}
      </Button>
    </div>
  )
}
