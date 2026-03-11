'use client'

// hooks/useByok.ts — Read/write BYOK API keys from localStorage
// Keys never leave the browser except as request headers to /api/generate.

import { useState, useEffect, useCallback } from 'react'

const ANTHROPIC_KEY = 'byok_anthropic_key'
const IDEOGRAM_KEY = 'byok_ideogram_key'

export interface ByokKeys {
  anthropicKey: string
  ideogramKey: string
}

export function useByok() {
  const [keys, setKeys] = useState<ByokKeys>({ anthropicKey: '', ideogramKey: '' })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Only runs in browser
    const anthropicKey = localStorage.getItem(ANTHROPIC_KEY) ?? ''
    const ideogramKey = localStorage.getItem(IDEOGRAM_KEY) ?? ''
    setKeys({ anthropicKey, ideogramKey })
    setLoaded(true)
  }, [])

  const saveKeys = useCallback((anthropicKey: string, ideogramKey: string) => {
    localStorage.setItem(ANTHROPIC_KEY, anthropicKey)
    localStorage.setItem(IDEOGRAM_KEY, ideogramKey)
    setKeys({ anthropicKey, ideogramKey })
  }, [])

  const clearKeys = useCallback(() => {
    localStorage.removeItem(ANTHROPIC_KEY)
    localStorage.removeItem(IDEOGRAM_KEY)
    setKeys({ anthropicKey: '', ideogramKey: '' })
  }, [])

  const hasKeys = loaded && keys.anthropicKey.trim() !== '' && keys.ideogramKey.trim() !== ''

  return { keys, saveKeys, clearKeys, hasKeys, loaded }
}
