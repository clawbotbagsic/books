'use client'

// components/landing/WizardStep4Pronouns.tsx
// Step 4 of 4: Pronoun selection (He/Him + She/Her only; They/Them is Phase 2)

import { useState } from 'react'

type Pronouns = 'he/him' | 'she/her'

interface Props {
  childName: string
  onSubmit: (pronouns: Pronouns) => void
  submitting: boolean
  submitError: string | null
}

const OPTIONS: { value: Pronouns; label: string; sub: string }[] = [
  { value: 'he/him',  label: 'He / Him',  sub: 'He went on an adventure…' },
  { value: 'she/her', label: 'She / Her', sub: 'She went on an adventure…' },
]

export function WizardStep4Pronouns({ childName, onSubmit, submitting, submitError }: Props) {
  const [selected, setSelected] = useState<Pronouns | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!selected) {
      setError('Please pick pronouns.')
      return
    }
    setError('')
    onSubmit(selected)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Question */}
      <div>
        <h2 className="font-fredoka text-3xl text-[#2d1a06] mb-1">
          What are their pronouns?
        </h2>
        <p className="font-nunito text-sm text-amber-800">
          We'll use these throughout {childName ? `${childName}'s` : 'their'} story
        </p>
      </div>

      {/* Pronoun cards */}
      <div className="grid grid-cols-2 gap-4">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => { setSelected(opt.value); setError('') }}
            className={`
              relative rounded-2xl p-5 text-center border-2 transition-all active:scale-95
              ${selected === opt.value
                ? 'border-amber-500 bg-amber-50 shadow-md shadow-amber-100'
                : 'border-amber-100 bg-white hover:border-amber-300'
              }
            `}
          >
            {selected === opt.value && (
              <span className="absolute top-3 right-3 text-amber-500 text-lg">✓</span>
            )}
            <p className="font-fredoka text-2xl text-[#2d1a06]">{opt.label}</p>
            <p className="font-nunito text-xs text-amber-700/70 mt-1">{opt.sub}</p>
          </button>
        ))}
      </div>

      {(error || submitError) && (
        <p className="font-nunito text-sm text-red-500">{error || submitError}</p>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!selected || submitting}
        className="
          w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white
          font-fredoka text-lg rounded-2xl py-4 px-6
          hover:from-amber-600 hover:to-amber-700
          active:scale-[0.98] transition-all shadow-md shadow-amber-200
          disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        "
      >
        {submitting ? 'Making their book…' : 'Make their book ✦'}
      </button>
    </div>
  )
}
