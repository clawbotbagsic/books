'use client'

// hooks/useByok.ts — Read/write BYOK API keys from localStorage
// Keys never leave the browser except as request headers to /api/generate.

import { useState, useEffect, useCallback } from 'react'

const ANTHROPIC_KEY = 'byok_anthropic_key'
const REPLICATE_KEY = 'byok_replicate_key'

export interface ByokKeys {
  anthropicKey: string
  replicateKey: string
}

export function useByok() {
  const [keys, setKeys] = useState<ByokKeys>({ anthropicKey: '', replicateKey: '' })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Only runs in browser
    const anthropicKey = localStorage.getItem(ANTHROPIC_KEY) ?? ''
    const replicateKey = localStorage.getItem(REPLICATE_KEY) ?? ''
    setKeys({ anthropicKey, replicateKey })
    setLoaded(true)
  }, [])

  const saveKeys = useCallback((anthropicKey: string, replicateKey: string) => {
    localStorage.setItem(ANTHROPIC_KEY, anthropicKey)
    localStorage.setItem(REPLICATE_KEY, replicateKey)
    setKeys({ anthropicKey, replicateKey })
  }, [])

  const clearKeys = useCallback(() => {
    localStorage.removeItem(ANTHROPIC_KEY)
    localStorage.removeItem(REPLICATE_KEY)
    setKeys({ anthropicKey: '', replicateKey: '' })
  }, [])

  const hasKeys = loaded && keys.anthropicKey.trim() !== '' && keys.replicateKey.trim() !== ''

  return { keys, saveKeys, clearKeys, hasKeys, loaded }
}
