// lib/profanity.ts — PurgoMalum profanity filter wrapper
//
// PurgoMalum is a free, no-auth profanity detection API.
// Endpoint: https://www.purgomalum.com/service/containsprofanity?text=TEXT
// Returns plain text "true" or "false".
//
// We run two checks per book generation:
//   1. Input gate  — theme field before Claude is called
//   2. Output gate — all page text fields after story generation, before Supabase insert

import type { StoryJSON } from '@/types'

const BASE_URL = 'https://www.purgomalum.com/service/containsprofanity'

// PurgoMalum has practical URL length limits. We chunk conservatively.
const CHUNK_SIZE = 1000

/**
 * Check a single string for profanity.
 * Returns true if profanity detected, false if clean, false on network error (fail open).
 */
async function checkText(text: string): Promise<boolean> {
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE))
  }

  for (const chunk of chunks) {
    try {
      const url = `${BASE_URL}?text=${encodeURIComponent(chunk)}`
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'books.tunedfor.ai profanity-check/1.0' },
        // Don't let a slow response block generation — 3s timeout
        signal: AbortSignal.timeout(3000),
      })
      if (!res.ok) {
        // Fail open — don't block generation over a filter API outage
        console.warn('[profanity] PurgoMalum returned', res.status, '— skipping check')
        return false
      }
      const body = (await res.text()).trim().toLowerCase()
      if (body === 'true') return true
    } catch (err) {
      // Network error or timeout — fail open
      console.warn('[profanity] PurgoMalum check failed (fail open):', err)
      return false
    }
  }

  return false
}

/**
 * Check user-supplied theme text before calling Claude.
 * Returns true if the theme contains profanity.
 */
export async function themeContainsProfanity(theme: string): Promise<boolean> {
  return checkText(theme)
}

/**
 * Check all page text fields from a generated StoryJSON.
 * Returns true if any page contains profanity.
 */
export async function storyContainsProfanity(storyJSON: StoryJSON): Promise<boolean> {
  // Concatenate all page texts for a single chunked pass
  const fullText = storyJSON.pages.map(p => p.text).join(' ')
  return checkText(fullText)
}
