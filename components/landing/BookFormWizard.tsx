'use client'

// components/landing/BookFormWizard.tsx
// 4-step wizard orchestrator — replaces BookForm.tsx on the home page

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/context/SessionContext'
import { WizardStep1Name }     from './WizardStep1Name'
import { WizardStep2Age }      from './WizardStep2Age'
import { WizardStep3Theme }    from './WizardStep3Theme'
import { WizardStep4Pronouns } from './WizardStep4Pronouns'
import type { ReadMode }       from '@/types/index'

type Step = 1 | 2 | 3 | 4

const STEP_HINTS: Record<Step, string> = {
  1: 'Name',
  2: 'Age',
  3: 'Adventure',
  4: 'Almost done',
}

export function BookFormWizard() {
  const router = useRouter()
  const { sessionId, usageCount, usageLimit, hasKeys, byokKeys, openByokModal } = useSession()

  // Collected form data
  const [childName, setChildName]   = useState('')
  const [age, setAge]               = useState<number | null>(null)
  const [readMode, setReadMode]     = useState<ReadMode>('aloud')
  const [theme, setTheme]           = useState('')

  // UI state
  const [step, setStep]             = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Derive tier from age
  const getTier = (a: number): 1 | 2 | 3 => {
    if (a <= 4) return 1
    if (a <= 6) return 2
    return 3
  }

  // Step 1 → 2
  const handleStep1 = useCallback((name: string) => {
    setChildName(name)
    setStep(2)
  }, [])

  // Step 2 → 3
  const handleStep2 = useCallback((selectedAge: number, selectedReadMode: ReadMode) => {
    setAge(selectedAge)
    setReadMode(selectedReadMode)
    setStep(3)
  }, [])

  // Step 3 → 4
  const handleStep3 = useCallback((selectedTheme: string) => {
    setTheme(selectedTheme)
    setStep(4)
  }, [])

  // Step 4 → submit
  const handleSubmit = useCallback(async (pronouns: 'he/him' | 'she/her') => {
    setSubmitError(null)

    // BYOK gate — same logic as BookForm.tsx
    const needsByok = usageCount >= usageLimit
    if (needsByok && !hasKeys) {
      openByokModal()
      return
    }

    if (!sessionId || age === null) {
      setSubmitError('Session not ready. Please wait and try again.')
      return
    }

    setSubmitting(true)

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (hasKeys) {
      headers['x-anthropic-key'] = byokKeys.anthropicKey
      headers['x-replicate-key'] = byokKeys.replicateKey
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sessionId,
          childName,
          age,
          tier: getTier(age),
          theme,
          readMode,
          pronouns,
        }),
      })

      if (res.status === 402) {
        setSubmitting(false)
        openByokModal()
        return
      }

      if (res.status === 401) {
        const data = await res.json().catch(() => ({}))
        const keyName = data.failedKey === 'replicate' ? 'Replicate' : 'Anthropic'
        setSubmitError(`Your ${keyName} API key is invalid. Please update it in Settings.`)
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
      router.push(`/generating?uuid=${data.uuid}`)
    } catch {
      setSubmitError('Could not connect. Please check your internet connection.')
      setSubmitting(false)
    }
  }, [sessionId, usageCount, usageLimit, hasKeys, byokKeys, openByokModal, age, childName, theme, readMode, router])

  return (
    <div id="wizard" className="w-full">
      {/* Step indicator */}
      <div className="flex flex-col items-center mb-6">
        <p className="font-nunito text-sm text-amber-700 mb-3">
          ✦ Step {step} of 4 — {STEP_HINTS[step]}
        </p>
        <div className="flex items-center gap-2">
          {([1, 2, 3, 4] as Step[]).map(s => (
            <div
              key={s}
              className={`
                rounded-full bg-amber-500 transition-all duration-300
                ${s === step ? 'w-7 h-3' : 'w-3 h-3 opacity-30'}
              `}
            />
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="relative bg-white rounded-3xl shadow-xl border border-amber-100 p-6 md:p-8 max-w-[560px] mx-auto">
        {/* Corner star accents */}
        <span className="absolute top-4 left-4 text-amber-200 text-xl" aria-hidden="true">✦</span>
        <span className="absolute top-4 right-4 text-amber-200 text-xl" aria-hidden="true">✦</span>

        {step === 1 && <WizardStep1Name onNext={handleStep1} />}
        {step === 2 && <WizardStep2Age  onNext={handleStep2} />}
        {step === 3 && <WizardStep3Theme onNext={handleStep3} />}
        {step === 4 && (
          <WizardStep4Pronouns
            childName={childName}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitError={submitError}
          />
        )}
      </div>
    </div>
  )
}
