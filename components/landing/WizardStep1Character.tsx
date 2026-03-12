'use client'

// components/landing/WizardStep1Character.tsx
// Step 1 of 5: Character selection — pick which creature stars in the story

import { useState } from 'react'
import { CHARACTERS } from '@/lib/characters'

interface Props {
  onNext: (characterId: string) => void
}

export function WizardStep1Character({ onNext }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleNext = () => {
    if (!selected) {
      setError('Pick a character to start the adventure!')
      return
    }
    setError('')
    onNext(selected)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Question */}
      <div>
        <h2 className="font-fredoka text-3xl text-[#2d1a06] mb-1">
          Choose a character
        </h2>
        <p className="font-nunito text-sm text-amber-800">
          Your child becomes this creature in every adventure ✦
        </p>
      </div>

      {/* Character grid — 4 columns × 2 rows */}
      <div className="grid grid-cols-4 gap-2.5">
        {CHARACTERS.map(char => (
          <button
            key={char.id}
            onClick={() => { setSelected(char.id); setError('') }}
            className={`
              relative rounded-2xl p-2 flex flex-col items-center gap-1 border-2
              transition-all active:scale-95 cursor-pointer
              ${selected === char.id
                ? 'border-amber-500 bg-amber-50 shadow-md shadow-amber-100'
                : 'border-amber-100 bg-white hover:border-amber-300'
              }
            `}
          >
            {/* Checkmark badge */}
            {selected === char.id && (
              <span className="absolute top-1.5 right-1.5 text-amber-500 text-xs leading-none font-bold">
                ✓
              </span>
            )}

            {/* Character image */}
            <div className="w-full aspect-square rounded-xl overflow-hidden bg-amber-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={char.anchorUrl}
                alt={`${char.name} the ${char.species}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Name + tagline */}
            <p className="font-fredoka text-sm text-[#2d1a06] leading-tight">{char.name}</p>
            <p className="font-nunito text-[10px] text-amber-700/70 leading-tight text-center">
              {char.tagline}
            </p>
          </button>
        ))}
      </div>

      {error && (
        <p className="font-nunito text-sm text-red-500 -mt-1">{error}</p>
      )}

      {/* Next button */}
      <button
        onClick={handleNext}
        className="
          w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white
          font-fredoka text-lg rounded-2xl py-4 px-6
          hover:from-amber-600 hover:to-amber-700
          active:scale-[0.98] transition-all shadow-md shadow-amber-200
        "
      >
        Next up — what's their name? →
      </button>
    </div>
  )
}
