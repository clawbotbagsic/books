'use client'

// components/landing/WizardStep1Name.tsx
// Step 1 of 4: Child's name input

import { useState } from 'react'

interface Props {
  onNext: (name: string) => void
}

export function WizardStep2Name({ onNext }: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleNext = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter the child\'s name.')
      return
    }
    setError('')
    onNext(trimmed)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Question */}
      <div>
        <h2 className="font-fredoka text-3xl text-[#2d1a06] mb-1">
          What's your child's name?
        </h2>
        <p className="font-nunito text-sm text-amber-800">
          Their name will be woven into the whole story ✦
        </p>
      </div>

      {/* Name input — Caveat handwritten style */}
      <div className="relative">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value.slice(0, 20))}
          onKeyDown={e => e.key === 'Enter' && handleNext()}
          placeholder="Landon…"
          autoFocus
          className="
            w-full bg-transparent border-0 border-b-2 border-amber-300
            font-caveat text-4xl text-[#2d1a06] placeholder:text-amber-200
            pb-2 pr-8 focus:outline-none focus:border-amber-500
            transition-colors
          "
        />
        <span className="absolute right-0 bottom-2 text-2xl" aria-hidden="true">✏️</span>
      </div>
      {error && (
        <p className="font-nunito text-sm text-red-500 -mt-4">{error}</p>
      )}
      <p className="font-nunito text-xs text-amber-700/60 -mt-4">
        {20 - name.length} characters remaining
      </p>

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
        Next up — how old are they? →
      </button>
    </div>
  )
}
