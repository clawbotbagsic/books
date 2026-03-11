'use client'

// hooks/useSession.ts — Read/write anonymous session UUID from localStorage

import { useState, useEffect } from 'react'

const SESSION_KEY = 'session_uuid'

function generateSessionId(): string {
  return crypto.randomUUID()
}

export function useSession() {
  const [sessionId, setSessionId] = useState<string>('')

  useEffect(() => {
    // Only runs in browser
    let existing = localStorage.getItem(SESSION_KEY)
    if (!existing) {
      existing = generateSessionId()
      localStorage.setItem(SESSION_KEY, existing)
    }
    setSessionId(existing)
  }, [])

  return sessionId
}
