'use client'

// hooks/useBookGeneration.ts — Manages generation state and polls /api/book/[uuid]

import { useState, useEffect, useRef, useCallback } from 'react'
import type { BookRecord } from '@/types/index'

export type GenerationStatus =
  | 'idle'
  | 'submitting'
  | 'writing'
  | 'illustrating'
  | 'complete'
  | 'error'

export interface GenerationState {
  status: GenerationStatus
  bookUuid: string | null
  pagesComplete: number
  totalPages: number                  // derived from pages.length in the poll response
  imageUrls: (string | null)[]        // per-page URLs as they arrive — null until rendered
  childName: string
  theme: string
  errorMessage: string | null
}

const POLL_INTERVAL_MS = 2000

export function useBookGeneration() {
  const [state, setState] = useState<GenerationState>({
    status: 'idle',
    bookUuid: null,
    pagesComplete: 0,
    totalPages: 0,
    imageUrls: [],
    childName: '',
    theme: '',
    errorMessage: null,
  })

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeUuidRef = useRef<string | null>(null)

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const pollBook = useCallback(
    async (uuid: string) => {
      if (activeUuidRef.current !== uuid) return // stale poll

      try {
       const res = await fetch(`/api/book/${uuid}?t=${Date.now()}`)

        if (res.status === 404 || res.status === 410) {
          stopPolling()
          setState(prev => ({
            ...prev,
            status: 'error',
            errorMessage: 'Book not found or expired.',
          }))
          return
        }

        if (!res.ok) {
          // Non-fatal poll error — retry
          pollTimerRef.current = setTimeout(() => pollBook(uuid), POLL_INTERVAL_MS)
          return
        }

        const book: BookRecord = await res.json()

        // Extract per-page image URLs and metadata on every poll
        const imageUrls = book.pages.map(p => p.image_url)
        const totalPages = book.pages.length
        const childName = book.childName
        const theme = book.theme

        if (book.status === 'complete') {
          stopPolling()
          setState(prev => ({
            ...prev,
            status: 'complete',
            pagesComplete: book.pages_complete,
            totalPages,
            imageUrls,
            childName,
            theme,
            bookUuid: uuid,
          }))
          return
        }

        if (book.status === 'failed') {
          stopPolling()
          setState(prev => ({
            ...prev,
            status: 'error',
            errorMessage: 'Book generation failed. Please try again.',
          }))
          return
        }

        // Still generating — update progress and schedule next poll
        const pagesComplete = book.pages_complete ?? 0
        setState(prev => ({
          ...prev,
          status: pagesComplete > 0 ? 'illustrating' : 'writing',
          pagesComplete,
          totalPages,
          imageUrls,
          childName,
          theme,
        }))

        pollTimerRef.current = setTimeout(() => pollBook(uuid), POLL_INTERVAL_MS)
      } catch {
        // Network error — retry
        if (activeUuidRef.current === uuid) {
          pollTimerRef.current = setTimeout(() => pollBook(uuid), POLL_INTERVAL_MS)
        }
      }
    },
    [stopPolling]
  )

  const startGeneration = useCallback(
    (uuid: string) => {
      stopPolling()
      activeUuidRef.current = uuid
      setState({
        status: 'writing',
        bookUuid: uuid,
        pagesComplete: 0,
        totalPages: 0,
        imageUrls: [],
        childName: '',
        theme: '',
        errorMessage: null,
      })
      // Start polling after initial delay to allow server to begin
      pollTimerRef.current = setTimeout(() => pollBook(uuid), POLL_INTERVAL_MS)
    },
    [pollBook, stopPolling]
  )

  const reset = useCallback(() => {
    stopPolling()
    activeUuidRef.current = null
    setState({
      status: 'idle',
      bookUuid: null,
      pagesComplete: 0,
      totalPages: 0,
      imageUrls: [],
      childName: '',
      theme: '',
      errorMessage: null,
    })
  }, [stopPolling])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPolling()
      activeUuidRef.current = null
    }
  }, [stopPolling])

  return { state, startGeneration, reset }
}
