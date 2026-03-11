'use client'

// components/form/BookForm.tsx — 4-field creation form with tier display

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TierSelector } from './TierSelector'
import { ThemeSuggestions } from './ThemeSuggestions'
import { useSession } from '@/context/SessionContext'
import { getDefaultTier, nudgeTier, getTierByNumber } from '@/lib/lexile'
import type { LexileTier } from '@/types/index'

const AGE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 3) // 3–12

const PRONOUN_OPTIONS = [
  { value: 'they/them', label: 'They/Them' },
  { value: 'she/her', label: 'She/Her' },
  { value: 'he/him', label: 'He/Him' },
] as const

interface FormErrors {
  childName?: string
  theme?: string
}

export function BookForm() {
  const router = useRouter()
  const { sessionId, usageCount, usageLimit, hasKeys, byokKeys, openByokModal } = useSession()

  // Form state
  const [childName, setChildName] = useState('')
  const [age, setAge] = useState<number>(7)
  const [theme, setTheme] = useState('')
  const [pronouns, setPronouns] = useState<'he/him' | 'she/her' | 'they/them'>('they/them')
  const [sidekick, setSidekick] = useState('')
  const [tierNumber, setTierNumber] = useState<number>(() => getDefaultTier(7).tier)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const selectedTier: LexileTier = getTierByNumber(tierNumber)

  // When age changes, reset tier to default for that age
  const handleAgeChange = useCallback((newAge: number) => {
    setAge(newAge)
    const defaultTier = getDefaultTier(newAge)
    setTierNumber(defaultTier.tier)
  }, [])

  const handleNudge = useCallback((direction: 1 | -1) => {
    setTierNumber(prev => nudgeTier(prev, direction))
  }, [])

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!childName.trim()) {
      newErrors.childName = "Please enter the child's name."
    } else if (childName.trim().length > 30) {
      newErrors.childName = 'Name must be 30 characters or less.'
    }
    if (!theme.trim()) {
      newErrors.theme = 'Please enter a book theme or pick a suggestion below.'
    } else if (theme.trim().length > 100) {
      newErrors.theme = 'Theme must be 100 characters or less.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    if (!validate()) return

    // Check free tier gate
    const needsByok = usageCount >= usageLimit
    if (needsByok && !hasKeys) {
      openByokModal()
      return
    }

    if (!sessionId) {
      setSubmitError('Session not ready. Please wait a moment and try again.')
      return
    }

    setSubmitting(true)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Send BYOK keys if available
    if (hasKeys) {
      headers['x-anthropic-key'] = byokKeys.anthropicKey
      headers['x-ideogram-key'] = byokKeys.ideogramKey
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sessionId,
          childName: childName.trim(),
          age,
          tier: tierNumber,
          theme: theme.trim(),
          pronouns,
          ...(sidekick.trim() ? { sidekick: sidekick.trim() } : {}),
        }),
      })

      if (res.status === 402) {
        // Free tier gate hit server-side — show modal
        setSubmitting(false)
        openByokModal()
        return
      }

      if (res.status === 401) {
        const data = await res.json().catch(() => ({}))
        const keyName = data.failedKey === 'ideogram' ? 'Ideogram' : 'Anthropic'
        setSubmitError(
          `Your ${keyName} API key is invalid or expired. Please update it in Settings.`
        )
        setSubmitting(false)
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSubmitError(data.error ?? 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }

      const data = await res.json()
      const uuid: string = data.uuid

      // Navigate to generating page (it will redirect to reader when done)
      router.push(`/generating?uuid=${uuid}`)
    } catch {
      setSubmitError('Could not connect to the server. Please check your internet connection.')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto">
      {/* Child's name */}
      <Input
        id="child-name"
        label="Child's name"
        value={childName}
        onChange={setChildName}
        placeholder="e.g. Maya"
        maxLength={30}
        required
        error={errors.childName}
        disabled={submitting}
      />

      {/* Age */}
      <div className="flex flex-col gap-1">
        <label htmlFor="child-age" className="text-sm font-medium text-gray-700">
          Child's age <span className="text-amber-600 ml-0.5" aria-hidden="true">*</span>
        </label>
        <select
          id="child-age"
          value={age}
          onChange={e => handleAgeChange(Number(e.target.value))}
          disabled={submitting}
          aria-label="Child's age"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 bg-white min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
        >
          {AGE_OPTIONS.map(a => (
            <option key={a} value={a}>
              {a} years old
            </option>
          ))}
        </select>
      </div>

      {/* Pronouns */}
      <div className="flex flex-col gap-1">
        <label htmlFor="pronouns" className="text-sm font-medium text-gray-700">
          Pronouns
        </label>
        <select
          id="pronouns"
          value={pronouns}
          onChange={e =>
            setPronouns(e.target.value as 'he/him' | 'she/her' | 'they/them')
          }
          disabled={submitting}
          aria-label="Child's pronouns"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 bg-white min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
        >
          {PRONOUN_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sidekick */}
      <div className="flex flex-col gap-1">
        <label htmlFor="sidekick" className="text-sm font-medium text-gray-500">
          Pet or Sidekick <span className="font-normal">(optional)</span>
        </label>
        <input
          id="sidekick"
          type="text"
          value={sidekick}
          onChange={e => setSidekick(e.target.value)}
          placeholder="e.g., a brave little cat named Whiskers"
          maxLength={50}
          disabled={submitting}
          aria-label="Pet or sidekick companion character (optional)"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 bg-white min-h-[44px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
        />
        <p className="text-xs text-gray-400">A companion who appears alongside {childName || 'the child'} in the story.</p>
      </div>

      {/* Theme */}
      <div className="flex flex-col gap-3">
        <Input
          id="book-theme"
          label="Book theme"
          value={theme}
          onChange={setTheme}
          placeholder="e.g. A space adventure with talking robots"
          maxLength={100}
          required
          error={errors.theme}
          disabled={submitting}
        />
        <div>
          <p className="text-xs text-gray-500 mb-2">Or pick a suggestion:</p>
          <ThemeSuggestions onSelect={setTheme} currentValue={theme} />
        </div>
      </div>

      {/* Reading level tier selector */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-gray-700">Reading level</p>
        <TierSelector
          selectedTier={selectedTier}
          onNudge={handleNudge}
          canNudgeUp={tierNumber < 5}
          canNudgeDown={tierNumber > 1}
        />
      </div>

      {/* Submit error */}
      {submitError && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700"
        >
          {submitError}
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        loading={submitting}
        size="lg"
        className="w-full"
        aria-label="Create your personalized book"
      >
        {submitting ? 'Creating your book...' : 'Create My Book'}
      </Button>

      {/* Free tier indicator */}
      {usageCount < usageLimit && (
        <p className="text-center text-xs text-gray-500">
          {usageLimit - usageCount} free{' '}
          {usageLimit - usageCount === 1 ? 'book' : 'books'} remaining
        </p>
      )}
    </div>
  )
}
