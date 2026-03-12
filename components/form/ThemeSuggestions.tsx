'use client'

// components/form/ThemeSuggestions.tsx — Clickable pill chips for suggested themes

const SUGGESTIONS = [
  'A space adventure',
  'Finding a lost puppy',
  'A magical garden',
  'Making a new friend',
  'A day at the beach',
  'A dragon who loves to bake',
  'Learning to ride a bike',
  'A rainy day at home',
]

interface ThemeSuggestionsProps {
  onSelect: (theme: string) => void
  currentValue: string
}

export function ThemeSuggestions({ onSelect, currentValue }: ThemeSuggestionsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Theme suggestions">
      {SUGGESTIONS.map(suggestion => {
        const isActive = currentValue === suggestion
        return (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            aria-pressed={isActive}
            aria-label={`Use theme: ${suggestion}`}
            className={[
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150',
              'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1',
              isActive
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-gray-700 border-gray-300 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50',
            ].join(' ')}
          >
            {suggestion}
          </button>
        )
      })}
    </div>
  )
}
