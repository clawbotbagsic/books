'use client'

// components/landing/WizardStep2Age.tsx
// Step 2 of 4: Age selection (3-8) + reading mode toggle

import { useState } from 'react'
import type { ReadMode } from '@/types/index'

interface Props {
  onNext: (age: number, readMode: ReadMode) => void
}

const AGES = [3, 4, 5, 6, 7, 8]

function getTierLabel(age: number, readMode: ReadMode): string {
  if (age <= 4) return 'Pre-Reader · 12 pages · We\'ll read this one together ✦'
  if (age <= 6) {
    return readMode === 'aloud'
      ? 'Early Reader · 14 pages · Read together'
      : 'Early Reader · 14 pages · They\'ll read it'
  }
  return readMode === 'aloud'
    ? 'Developing Reader · 20 pages · Read together'
    : 'Developing Reader · 20 pages · They\'ll read it'
}

export function WizardStep3Age({ onNext }: Props) {
  const [selectedAge, setSelectedAge] = useState<number | null>(null)
  const [readMode, setReadMode] = useState<ReadMode>('aloud')
  const [error, setError] = useState('')

  const handleAgeSelect = (age: number) => {
    setSelectedAge(age)
    // Ages 3-4 are locked to aloud — reset any independent selection
    if (age <= 4) setReadMode('aloud')
    setError('')
  }

  const handleNext = () => {
    if (!selectedAge) {
      setError('Please select an age.')
      return
    }
    const effectiveReadMode: ReadMode = selectedAge <= 4 ? 'aloud' : readMode
    onNext(selectedAge, effectiveReadMode)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Question */}
      <div>
        <h2 className="font-fredoka text-3xl text-[#2d1a06] mb-1">
          How old are they?
        </h2>
        <p className="font-nunito text-sm text-amber-800">
          We'll match the book to their reading level
        </p>
      </div>

      {/* Age tiles */}
      <div className="grid grid-cols-3 gap-3">
        {AGES.map(age => (
          <button
            key={age}
            onClick={() => handleAgeSelect(age)}
            className={`
              rounded-2xl py-5 text-center font-fredoka text-3xl
              border-2 transition-all active:scale-95
              ${selectedAge === age
                ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-md shadow-amber-100'
                : 'border-amber-100 bg-white text-[#2d1a06] hover:border-amber-300'
              }
            `}
          >
            {age}
          </button>
        ))}
      </div>

      {/* Tier label */}
      {selectedAge && (
        <div className="bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
          <p className="font-nunito text-sm font-semibold text-amber-800">
            {getTierLabel(selectedAge, readMode)}
          </p>
        </div>
      )}

      {/* Reading mode toggle — only for ages 5-8 */}
      {selectedAge !== null && selectedAge >= 5 && (
        <div>
          <p className="font-nunito text-xs text-amber-700/70 mb-2">Who's reading it?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setReadMode('aloud')}
              className={`
                rounded-2xl p-4 text-left border-2 transition-all
                ${readMode === 'aloud'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-amber-100 bg-white hover:border-amber-300'
                }
              `}
            >
              <div className="text-2xl mb-1">🤝</div>
              <div className="font-nunito text-sm font-semibold text-[#2d1a06]">
                We'll read it together
              </div>
            </button>
            <button
              onClick={() => setReadMode('independent')}
              className={`
                rounded-2xl p-4 text-left border-2 transition-all
                ${readMode === 'independent'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-amber-100 bg-white hover:border-amber-300'
                }
              `}
            >
              <div className="text-2xl mb-1">📖</div>
              <div className="font-nunito text-sm font-semibold text-[#2d1a06]">
                They'll read it
              </div>
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="font-nunito text-sm text-red-500">{error}</p>
      )}

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={!selectedAge}
        className="
          w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white
          font-fredoka text-lg rounded-2xl py-4 px-6
          hover:from-amber-600 hover:to-amber-700
          active:scale-[0.98] transition-all shadow-md shadow-amber-200
          disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        "
      >
        Next — what's the adventure? →
      </button>
    </div>
  )
}
