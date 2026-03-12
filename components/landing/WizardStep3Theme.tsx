'use client'

// components/landing/WizardStep3Theme.tsx
// Step 3 of 4: 10 illustrated theme chips

import { useState } from 'react'
import type { ThemeKey } from '@/types/index'

interface ThemeOption {
  key: ThemeKey
  emoji: string
  label: string
}

const THEMES: ThemeOption[] = [
  { key: 'lost-in-the-jungle',        emoji: '🦕', label: 'Lost in the Jungle' },
  { key: 'space-mission',             emoji: '🚀', label: 'Space Mission' },
  { key: 'dragon-who-was-different',  emoji: '🐉', label: 'The Dragon Who Was Different' },
  { key: 'great-ocean-voyage',        emoji: '🌊', label: 'The Great Ocean Voyage' },
  { key: 'forbidden-door',            emoji: '🏰', label: 'The Forbidden Door' },
  { key: 'enchanted-forest',          emoji: '🌲', label: 'Into the Enchanted Forest' },
  { key: 'everyday-hero',             emoji: '🦸', label: 'Everyday Hero' },
  { key: 'unexpected-friend',         emoji: '🐾', label: 'The Unexpected Friend' },
  { key: 'wishing-star',              emoji: '⭐', label: 'The Wishing Star' },
  { key: 'before-the-storm',          emoji: '🌪️', label: 'Before the Storm' },
]

// Maps ThemeKey → human-readable theme string sent to Claude
export const THEME_LABELS: Record<ThemeKey, string> = Object.fromEntries(
  THEMES.map(t => [t.key, t.label])
) as Record<ThemeKey, string>

interface Props {
  onNext: (themeLabel: string) => void
}

export function WizardStep3Theme({ onNext }: Props) {
  const [selected, setSelected] = useState<ThemeKey | null>(null)
  const [error, setError] = useState('')

  const handleNext = () => {
    if (!selected) {
      setError('Please pick an adventure.')
      return
    }
    onNext(THEME_LABELS[selected])
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Question */}
      <div>
        <h2 className="font-fredoka text-3xl text-[#2d1a06] mb-1">
          What's the adventure?
        </h2>
        <p className="font-nunito text-sm text-amber-800">
          Pick the world they'll step into
        </p>
      </div>

      {/* Theme chips — 2-column grid */}
      <div className="grid grid-cols-2 gap-2">
        {THEMES.map(theme => (
          <button
            key={theme.key}
            onClick={() => { setSelected(theme.key); setError('') }}
            className={`
              rounded-2xl p-3 text-left border-2 transition-all active:scale-95
              ${selected === theme.key
                ? 'border-amber-500 bg-amber-50'
                : 'border-amber-100 bg-white hover:border-amber-300'
              }
            `}
          >
            <span className="text-xl">{theme.emoji}</span>
            <p className="font-nunito text-xs font-semibold text-[#2d1a06] mt-1 leading-tight">
              {theme.label}
            </p>
          </button>
        ))}
      </div>

      {error && (
        <p className="font-nunito text-sm text-red-500">{error}</p>
      )}

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={!selected}
        className="
          w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white
          font-fredoka text-lg rounded-2xl py-4 px-6
          hover:from-amber-600 hover:to-amber-700
          active:scale-[0.98] transition-all shadow-md shadow-amber-200
          disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        "
      >
        Almost there — one last thing →
      </button>
    </div>
  )
}
