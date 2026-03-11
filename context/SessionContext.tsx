'use client'

// context/SessionContext.tsx — Provides session UUID, usage count, and BYOK status

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useByok } from '@/hooks/useByok'
import type { UsageResponse } from '@/types/index'

interface SessionContextValue {
  sessionId: string
  usageCount: number
  usageLimit: number
  byokRequired: boolean
  hasKeys: boolean
  byokKeys: { anthropicKey: string; ideogramKey: string }
  saveByokKeys: (anthropicKey: string, ideogramKey: string) => void
  refreshUsage: () => Promise<void>
  // Settings drawer state (lifted here so GearIcon and SettingsDrawer can share it)
  isSettingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
  // Byok modal state
  isByokModalOpen: boolean
  openByokModal: () => void
  closeByokModal: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

const SESSION_KEY = 'session_uuid'

function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string>('')
  const [usageCount, setUsageCount] = useState(0)
  const [usageLimit] = useState(3)
  const [byokRequired, setByokRequired] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isByokModalOpen, setIsByokModalOpen] = useState(false)

  const { keys, saveKeys, hasKeys } = useByok()

  // Initialize session ID from localStorage on mount
  useEffect(() => {
    const id = getOrCreateSessionId()
    setSessionId(id)
  }, [])

  const refreshUsage = useCallback(async () => {
    const id = localStorage.getItem(SESSION_KEY)
    if (!id) return

    try {
      const res = await fetch(`/api/usage?session=${encodeURIComponent(id)}`)
      if (!res.ok) return
      const data: UsageResponse = await res.json()
      setUsageCount(data.count)
      setByokRequired(data.byok_required)
    } catch {
      // Non-fatal — silently fail
    }
  }, [])

  // Fetch usage count once session ID is available
  useEffect(() => {
    if (sessionId) {
      refreshUsage()
    }
  }, [sessionId, refreshUsage])

  const openSettings = useCallback(() => setIsSettingsOpen(true), [])
  const closeSettings = useCallback(() => setIsSettingsOpen(false), [])
  const openByokModal = useCallback(() => setIsByokModalOpen(true), [])
  const closeByokModal = useCallback(() => setIsByokModalOpen(false), [])

  const value: SessionContextValue = {
    sessionId,
    usageCount,
    usageLimit,
    byokRequired,
    hasKeys,
    byokKeys: keys,
    saveByokKeys: saveKeys,
    refreshUsage,
    isSettingsOpen,
    openSettings,
    closeSettings,
    isByokModalOpen,
    openByokModal,
    closeByokModal,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    throw new Error('useSession must be used inside SessionProvider')
  }
  return ctx
}
