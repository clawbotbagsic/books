'use client'

// components/settings/GearIcon.tsx — Fixed top-right gear button, always visible
// Importing SettingsDrawer and ByokModal here so they're always in the tree

import { useSession } from '@/context/SessionContext'
import { SettingsDrawer } from './SettingsDrawer'
import { ByokModal } from '@/components/byok/ByokModal'

export function GearIcon() {
  const { openSettings, isSettingsOpen, closeSettings, isByokModalOpen, closeByokModal } =
    useSession()

  return (
    <>
      <button
        onClick={openSettings}
        aria-label="Open settings"
        className="fixed top-4 right-4 z-40 w-11 h-11 flex items-center justify-center rounded-full bg-white/90 shadow-md border border-gray-200 text-gray-600 hover:text-amber-600 hover:border-amber-300 transition-colors backdrop-blur-sm"
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
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      <SettingsDrawer isOpen={isSettingsOpen} onClose={closeSettings} />
      <ByokModal isOpen={isByokModalOpen} onClose={closeByokModal} />
    </>
  )
}
