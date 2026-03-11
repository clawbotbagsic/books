'use client'

// components/byok/ByokModal.tsx — Gate modal after book 3, prompts BYOK key entry

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useSession } from '@/context/SessionContext'

interface ByokModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ByokModal({ isOpen, onClose }: ByokModalProps) {
  const { byokKeys, saveByokKeys, openSettings } = useSession()

  const [anthropicKey, setAnthropicKey] = useState('')
  const [ideogramKey, setIdeogramKey] = useState('')
  const [saved, setSaved] = useState(false)

  // Reset inputs when modal opens
  useEffect(() => {
    if (isOpen) {
      setAnthropicKey(byokKeys.anthropicKey)
      setIdeogramKey(byokKeys.ideogramKey)
      setSaved(false)
    }
  }, [isOpen, byokKeys.anthropicKey, byokKeys.ideogramKey])

  const handleSave = () => {
    if (!anthropicKey.trim() || !ideogramKey.trim()) return
    saveByokKeys(anthropicKey.trim(), ideogramKey.trim())
    setSaved(true)
    setTimeout(() => {
      onClose()
    }, 600)
  }

  const handleOpenSettings = () => {
    onClose()
    openSettings()
  }

  const canSave = anthropicKey.trim() !== '' && ideogramKey.trim() !== ''

  return (
    <Modal isOpen={isOpen} onClose={onClose} dismissible maxWidth="md">
      <div className="flex flex-col gap-5">
        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-7 h-7 text-amber-600"
            aria-hidden="true"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">You've used your 3 free books.</h2>
          <p className="mt-2 text-gray-600">
            Add your own API keys to keep creating — it's free to set up and costs about $1 per book.
          </p>
        </div>

        {/* Key fields */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Input
              id="byok-anthropic-key"
              label="Anthropic API Key"
              value={anthropicKey}
              onChange={setAnthropicKey}
              type="password"
              placeholder="sk-ant-..."
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

          <div className="flex flex-col gap-2">
            <Input
              id="byok-ideogram-key"
              label="Ideogram API Key"
              value={ideogramKey}
              onChange={setIdeogramKey}
              type="password"
              placeholder="Your Ideogram key..."
            />
            <a
              href="https://ideogram.ai/manage-api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-600 hover:text-amber-700 underline"
            >
              Get a free Ideogram key
            </a>
          </div>
        </div>

        {/* Privacy note */}
        <p className="text-xs text-gray-500 text-center">
          Your keys stay on your device. We never see them.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full"
            aria-label="Save API keys and continue"
          >
            {saved ? 'Keys saved!' : 'Save Keys & Continue'}
          </Button>

          <Button
            onClick={handleOpenSettings}
            variant="secondary"
            className="w-full"
            aria-label="Open settings to enter API keys"
          >
            Open Settings
          </Button>

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-gray-500"
            aria-label="Dismiss this message"
          >
            Maybe later
          </Button>
        </div>
      </div>
    </Modal>
  )
}
