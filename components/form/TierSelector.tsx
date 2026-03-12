'use client'

// components/form/TierSelector.tsx — Shows auto-selected tier with nudge controls

import { LexileTier } from '@/types/index'

interface TierSelectorProps {
  selectedTier: LexileTier
  onNudge: (direction: 1 | -1) => void
  canNudgeUp: boolean
  canNudgeDown: boolean
}

const TIER_DESCRIPTIONS: Record<number, string> = {
  1: 'Short, simple sentences with familiar words. Perfect for the earliest readers who are just starting their reading journey.',
  2: 'A little more story, a little more adventure. Builds on sight words and simple phonics patterns.',
  3: 'Longer sentences with descriptive language and more story depth. Great for growing readers.',
  4: 'Rich vocabulary, complex story structure, and emotional depth. For confident readers who love a real story.',
  5: 'Sophisticated language with literary devices and layered themes. For advanced readers who love a challenge.',
}

export function TierSelector({
  selectedTier,
  onNudge,
  canNudgeUp,
  canNudgeDown,
}: TierSelectorProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-4">
        {/* Nudge down */}
        <button
          type="button"
          onClick={() => onNudge(-1)}
          disabled={!canNudgeDown}
          aria-label="Use an easier reading level"
          className={[
            'w-10 h-10 flex items-center justify-center rounded-full border transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
            canNudgeDown
              ? 'border-amber-300 text-amber-700 hover:bg-amber-100 bg-white'
              : 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed',
          ].join(' ')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Tier info */}
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">
              Reading Level
            </span>
            <span className="text-xs text-amber-500 bg-amber-100 rounded-full px-2 py-0.5 font-mono">
              Tier {selectedTier.tier}/5
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            {selectedTier.name} Reader
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{selectedTier.targetAge}</p>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
            {TIER_DESCRIPTIONS[selectedTier.tier]}
          </p>
          <p className="text-xs text-amber-600 mt-1.5 font-medium">
            {selectedTier.wordsPerPage} per page
          </p>
        </div>

        {/* Nudge up */}
        <button
          type="button"
          onClick={() => onNudge(1)}
          disabled={!canNudgeUp}
          aria-label="Use a harder reading level"
          className={[
            'w-10 h-10 flex items-center justify-center rounded-full border transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
            canNudgeUp
              ? 'border-amber-300 text-amber-700 hover:bg-amber-100 bg-white'
              : 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed',
          ].join(' ')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
