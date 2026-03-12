'use client'

import Image from 'next/image'
import { CHARACTERS, type Character } from '@/lib/characters'

interface CharacterPickerProps {
  selected: string | null
  onChange: (id: string) => void
}

export function CharacterPicker({ selected, onChange }: CharacterPickerProps) {
  return (
    <div className="w-full">
      <p className="text-sm text-gray-500 text-center mb-4">
        Pick a character — they&apos;ll star in the story as your child&apos;s book buddy.
      </p>

      <div className="grid grid-cols-4 gap-3">
        {CHARACTERS.map((char: Character) => {
          const isSelected = selected === char.id
          return (
            <button
              key={char.id}
              type="button"
              onClick={() => onChange(char.id)}
              className={`
                relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3
                transition-all duration-150 cursor-pointer
                ${isSelected
                  ? 'border-amber-400 bg-amber-50 shadow-md scale-[1.03]'
                  : 'border-gray-200 bg-white hover:border-amber-200 hover:bg-amber-50/40'
                }
              `}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-white text-xs font-bold shadow">
                  ✓
                </span>
              )}

              {/* Character image */}
              <div className="relative h-16 w-16">
                <Image
                  src={char.anchorUrl}
                  alt={char.name}
                  fill
                  sizes="64px"
                  className="object-contain"
                  unoptimized
                />
              </div>

              {/* Name + tagline */}
              <div className="text-center leading-tight">
                <p className="text-sm font-semibold text-gray-800">{char.name}</p>
                <p className="text-[11px] text-gray-400">{char.tagline}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
