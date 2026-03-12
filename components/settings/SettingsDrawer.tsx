'use client'

// components/settings/SettingsDrawer.tsx — Slides in from right, BYOK key entry

import { useState, useEffect } from 'react'
import { useSession } from '@/context/SessionContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface SettingsDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { byokKeys, saveByokKeys } = useSession()

  const [anthropicKey, setAnthropicKey] = useState('')
  const [replicateKey, setReplicateKey] = useState('')
  const [saved, setSaved] = useState(false)

  // Sync local state when drawer opens
  useEffect(() => {
    if (isOpen) {
      setAnthropicKey(byokKeys.anthropicKey)
      setReplicateKey(byokKeys.replicateKey)
      setSaved(false)
    }
  }, [isOpen, byokKeys.anthropicKey, byokKeys.replicateKey])

  // Trap focus and close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const handleSave = () => {
    saveByokKeys(anthropicKey.trim(), replicateKey.trim())
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 800)
  }

  const hasChanges =
    anthropicKey.trim() !== byokKeys.anthropicKey ||
    replicateKey.trim() !== byokKeys.replicateKey

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className={[
          'fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl',
          'flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
          {/* Privacy notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">Your keys stay on your device.</p>
            <p>We never see your API keys. They are stored only in your browser and sent directly to the AI services when you create a book.</p>
          </div>

          {/* Anthropic key */}
          <div className="flex flex-col gap-2">
            <Input
              id="anthropic-key"
              label="Anthropic API Key"
              value={anthropicKey}
              onChange={setAnthropicKey}
              type="password"
              placeholder="sk-ant-..."
              hint="Used for story generation (Claude)"
            />
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-600 hover:text-amber-700 underline"
            >
              Get a free Anthropic key
            </a>
          </div>

          {/* Replicate key */}
          <div className="flex flex-col gap-2">
            <Input
              id="replicate-key"
              label="Replicate API Token"
              value={replicateKey}
              onChange={setReplicateKey}
              type="password"
              placeholder="r8_..."
              hint="Used for character-consistent illustrations"
            />
            <a
              href="https://replicate.com/account/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-600 hover:text-amber-700 underline"
            >
              Get a free Replicate token
            </a>
          </div>

          {/* Current key status */}
          {(byokKeys.anthropicKey || byokKeys.replicateKey) && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
              <p className="font-semibold">Keys saved</p>
              <p className="text-green-700 mt-1">
                Your API keys are active. Books use your own API account.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-200 flex flex-col gap-3">
          <Button
            onClick={handleSave}
            disabled={!hasChanges && !saved}
            className="w-full"
            aria-label="Save API keys"
          >
            {saved ? 'Saved!' : 'Save Keys'}
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
            aria-label="Cancel and close settings"
          >
            Cancel
          </Button>
        </div>
      </div>
    </>
  )
}
