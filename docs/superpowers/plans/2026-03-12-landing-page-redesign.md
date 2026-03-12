# Landing Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current minimal landing page with a two-zone scrollable page — an illustrated hero with an auto-scrolling book film strip above the fold, and a 4-step playful wizard below the fold — and rename the product from "Story Spark" to "Inklings".

**Architecture:** The landing page is a server component (`app/page.tsx`) that renders two client zones: `HeroSection` (static but animated via CSS) and `BookFormWizard` (manages a 4-step state machine). The wizard replaces `BookForm.tsx` as the home-page form. Backend receives a new `readMode` field that adjusts prose register. Google Fonts (Fredoka One, Caveat, Nunito) are loaded once in `app/layout.tsx` via `next/font/google` and exposed as CSS variables that Tailwind references.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, `next/font/google`, TypeScript, React hooks (`useState`, `useCallback`), `useRouter` from `next/navigation`, `useSession` from existing `@/context/SessionContext`, Zod (already in project).

---

## Chunk 1: Backend — Types, Anthropic Prompt, Route Schema

### Task 1: Add `ReadMode`, `ThemeKey`, and `readMode` to `types/index.ts`

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Add the three new exports at the top of `types/index.ts`**

  Open `types/index.ts`. After the file comment on line 1, add before the `BookFormInput` interface:

  ```typescript
  export type ReadMode = 'aloud' | 'independent'

  export type ThemeKey =
    | 'lost-in-the-jungle'
    | 'space-mission'
    | 'dragon-who-was-different'
    | 'great-ocean-voyage'
    | 'forbidden-door'
    | 'enchanted-forest'
    | 'everyday-hero'
    | 'unexpected-friend'
    | 'wishing-star'
    | 'before-the-storm'
  ```

- [ ] **Step 2: Add `readMode` to `BookFormInput`**

  In the `BookFormInput` interface, change `theme: string` line and add `readMode` after it:

  ```typescript
  export interface BookFormInput {
    sessionId:  string
    childName:  string           // max 30 chars
    age:        number           // 3-8 (Phase 1); 9-12 Phase 2+
    tier:       1 | 2 | 3 | 4 | 5
    theme:      string           // one of the 10 ThemeKey values (Phase 1); free text Phase 2+
    readMode?:  ReadMode         // optional — defaults to 'aloud' if omitted (legacy BookForm compat)
    pronouns:   'he/him' | 'she/her' | 'they/them'
    sidekick?:  string           // optional companion character, max 50 chars
  }
  ```

  Note: `readMode` is optional (`?`) for backward compatibility with `BookForm.tsx` (dead code). The wizard always emits it; the API defaults it if absent.

- [ ] **Step 3: Verify TypeScript compiles cleanly**

  ```bash
  cd /path/to/project && npx tsc --noEmit
  ```

  Expected: 0 errors. If errors appear in `BookForm.tsx` or other files, they are pre-existing — document but do not fix in this task.

- [ ] **Step 4: Commit**

  ```bash
  git add types/index.ts
  git commit -m "feat: add ReadMode + ThemeKey types; readMode optional field on BookFormInput"
  ```

---

### Task 2: Add prose register conditional to `lib/anthropic.ts`

**Files:**
- Modify: `lib/anthropic.ts`

- [ ] **Step 1: Add the prose register block inside `buildStoryPrompt`**

  In `lib/anthropic.ts`, find the `buildStoryPrompt` function. After the `pronounMap` block (around line 24–30), add a `proseRegister` variable:

  ```typescript
  // Prose register — adjusts writing style based on how the book will be read
  const proseRegister = input.readMode === 'independent'
    ? `Write in an independent-reader register: strict adherence to sight word vocabulary, short confidence-building sentences, repetitive patterns that reward completion. Vocabulary must stay strictly within the Dolch/Fry list for this tier — no exceptions.`
    : `Write in a read-aloud register: slightly richer prose, atmospheric descriptions, sentences that have satisfying rhythm when spoken aloud. Vocabulary may slightly exceed the child's decoding level since a caregiver is reading.`
  ```

- [ ] **Step 2: Inject `proseRegister` into the system prompt**

  In the `systemPrompt` template string, find the `## VOICE & TONE` section (around line 57). Add a new section immediately after it:

  ```typescript
  ## READING MODE

  ${proseRegister}
  ```

  Place it between `## VOICE & TONE` and `## LEXILE TIER CONSTRAINTS`.

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 new errors.

- [ ] **Step 4: Commit**

  ```bash
  git add lib/anthropic.ts
  git commit -m "feat: add readMode prose register to story system prompt"
  ```

---

### Task 3: Add `readMode` to route schema in `app/api/generate/route.ts`

**Files:**
- Modify: `app/api/generate/route.ts`

- [ ] **Step 1: Add `readMode` to `RequestSchema`**

  Find `RequestSchema` in `app/api/generate/route.ts`. Add `readMode` as optional (defaults to `'aloud'` if absent — preserves backward compat with any integrations that don't send it yet):

  ```typescript
  const RequestSchema = z.object({
    sessionId: z.string().min(1, 'sessionId is required'),
    childName: z.string().min(1).max(30, 'Child name must be 30 characters or less'),
    age: z.number().int().min(3).max(8),          // Phase 1: ages 3-8 only
    tier: z.number().int().min(1).max(3),          // Phase 1: tiers 1-3 only
    theme: z.string().min(1).max(100, 'Theme must be 100 characters or less'),
    readMode: z.enum(['aloud', 'independent']).optional().default('aloud'),
    pronouns: z.enum(['he/him', 'she/her', 'they/them']),
    sidekick: z.string().max(50, 'Sidekick must be 50 characters or less').optional(),
  })
  ```

  Note: Also tightening `age` max to 8 and `tier` max to 3 — Phase 1 scope constraint. This makes the API reject Tiers 4–5 at the gate.

- [ ] **Step 2: Pass `readMode` into `bookInput`**

  Find the line that builds `bookInput` (around line 94). Update to include `readMode`:

  ```typescript
  const bookInput = {
    sessionId,
    childName,
    age,
    tier: tierNumber as 1 | 2 | 3,
    theme,
    readMode: parsed.data.readMode ?? 'aloud',
    pronouns,
    sidekick,
  }
  ```

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 new errors.

- [ ] **Step 4: Commit**

  ```bash
  git add app/api/generate/route.ts
  git commit -m "feat: add readMode to generate route; scope Phase 1 to age 3-8, tiers 1-3"
  ```

---

## Chunk 2: Font Setup + Layout Rename

### Task 4: Load Google Fonts via `next/font/google` and extend Tailwind

**Files:**
- Modify: `app/layout.tsx`
- Modify: `tailwind.config.js`

- [ ] **Step 1: Update `app/layout.tsx` to load all three fonts and expose CSS variables**

  Replace the current `app/layout.tsx` with:

  ```typescript
  import type { Metadata, Viewport } from 'next'
  import './globals.css'
  import { SessionProvider } from '@/context/SessionContext'
  import { GearIcon } from '@/components/settings/GearIcon'
  import { Fredoka_One, Caveat, Nunito } from 'next/font/google'

  const fredokaOne = Fredoka_One({
    weight: '400',
    subsets: ['latin'],
    variable: '--font-fredoka',
    display: 'swap',
  })

  const caveat = Caveat({
    weight: ['400', '600', '700'],
    subsets: ['latin'],
    variable: '--font-caveat',
    display: 'swap',
  })

  const nunito = Nunito({
    weight: ['400', '600', '700', '800', '900'],
    subsets: ['latin'],
    variable: '--font-nunito',
    display: 'swap',
  })

  export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://books.tunedfor.ai'),
    title: 'Inklings — A book made just for them',
    description:
      'Personalized illustrated children\'s books generated in under 3 minutes. Tailored to your child\'s name, age, and reading level.',
    openGraph: {
      title: 'Inklings — A book made just for them',
      description: 'Personalized illustrated children\'s books, generated instantly.',
      images: ['/og-image.png'],
      siteName: 'Inklings',
    },
  }

  export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  }

  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html
        lang="en"
        className={`${fredokaOne.variable} ${caveat.variable} ${nunito.variable}`}
      >
        <body>
          <SessionProvider>
            {children}
            <GearIcon />
          </SessionProvider>
        </body>
      </html>
    )
  }
  ```

- [ ] **Step 2: Extend Tailwind to reference the CSS font variables**

  Update `tailwind.config.js` — add font families under `theme.extend.fontFamily`:

  ```javascript
  module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
      './context/**/*.{js,ts,jsx,tsx,mdx}',
      './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        colors: {
          brand: {
            amber: '#F59E0B',
            orange: '#EA580C',
            warm: '#FEF3C7',
          },
        },
        fontFamily: {
          sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
          fredoka: ['var(--font-fredoka)', 'sans-serif'],
          caveat: ['var(--font-caveat)', 'cursive'],
          nunito: ['var(--font-nunito)', 'sans-serif'],
        },
        keyframes: {
          'scroll-left': {
            '0%':   { transform: 'translateX(0)' },
            '100%': { transform: 'translateX(-50%)' },
          },
        },
        animation: {
          'scroll-left': 'scroll-left 30s linear infinite',
        },
      },
    },
    plugins: [],
  }
  ```

- [ ] **Step 3: Verify TypeScript and build**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 new errors.

- [ ] **Step 4: Verify no "Story Spark" references remain in layout or metadata**

  ```bash
  grep -r "Story Spark" app/ components/ context/ lib/ types/ --include="*.ts" --include="*.tsx" --include="*.js"
  ```

  Expected: 0 matches. If any matches remain, update them to "Inklings" before committing.

- [ ] **Step 5: Commit**

  ```bash
  git add app/layout.tsx tailwind.config.js
  git commit -m "feat: load Fredoka One + Caveat + Nunito via next/font; rename to Inklings in metadata"
  ```

---

## Chunk 3: Wizard Components

All wizard components live in `components/landing/`. Create the directory first:

```bash
mkdir -p components/landing
```

### Task 5: `WizardStep1Name.tsx`

**Files:**
- Create: `components/landing/WizardStep1Name.tsx`

- [ ] **Step 1: Create the component**

  ```typescript
  'use client'

  // components/landing/WizardStep1Name.tsx
  // Step 1 of 4: Child's name input

  import { useState } from 'react'

  interface Props {
    onNext: (name: string) => void
  }

  export function WizardStep1Name({ onNext }: Props) {
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
  ```

- [ ] **Step 2: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 new errors.

- [ ] **Step 3: Commit**

  ```bash
  git add components/landing/WizardStep1Name.tsx
  git commit -m "feat: WizardStep1Name component — child name input with Caveat font"
  ```

---

### Task 6: `WizardStep2Age.tsx`

**Files:**
- Create: `components/landing/WizardStep2Age.tsx`

This is the most complex step — includes age tiles (3–8), dynamic tier label, and reading mode toggle.

- [ ] **Step 1: Create the component**

  ```typescript
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

  export function WizardStep2Age({ onNext }: Props) {
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
  ```

- [ ] **Step 2: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 new errors.

- [ ] **Step 3: Commit**

  ```bash
  git add components/landing/WizardStep2Age.tsx
  git commit -m "feat: WizardStep2Age — age tiles 3-8, tier label, readMode toggle"
  ```

---

### Task 7: `WizardStep3Theme.tsx`

**Files:**
- Create: `components/landing/WizardStep3Theme.tsx`

- [ ] **Step 1: Create the component**

  ```typescript
  'use client'

  // components/landing/WizardStep3Theme.tsx
  // Step 3 of 4: 10 illustrated theme chips

  import { useState } from 'react'
  import type { ThemeKey } from '@/types/index'

  interface ThemeOption {
    key: ThemeKey
    emoji: string
    label: string
    hook: string
  }

  const THEMES: ThemeOption[] = [
    { key: 'lost-in-the-jungle',        emoji: '🦕', label: 'Lost in the Jungle',          hook: 'Discovery' },
    { key: 'space-mission',             emoji: '🚀', label: 'Space Mission',                hook: 'Quest' },
    { key: 'dragon-who-was-different',  emoji: '🐉', label: 'The Dragon Who Was Different', hook: 'Transformation' },
    { key: 'great-ocean-voyage',        emoji: '🌊', label: 'The Great Ocean Voyage',       hook: 'Journey' },
    { key: 'forbidden-door',            emoji: '🏰', label: 'The Forbidden Door',           hook: 'Dare' },
    { key: 'enchanted-forest',          emoji: '🌲', label: 'Into the Enchanted Forest',    hook: 'New World' },
    { key: 'everyday-hero',             emoji: '🦸', label: 'Everyday Hero',                hook: 'Quest' },
    { key: 'unexpected-friend',         emoji: '🐾', label: 'The Unexpected Friend',        hook: 'Discovery' },
    { key: 'wishing-star',              emoji: '⭐', label: 'The Wishing Star',             hook: 'Journey' },
    { key: 'before-the-storm',          emoji: '🌪️', label: 'Before the Storm',            hook: 'Quest' },
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
  ```

- [ ] **Step 2: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 new errors.

- [ ] **Step 3: Commit**

  ```bash
  git add components/landing/WizardStep3Theme.tsx
  git commit -m "feat: WizardStep3Theme — 10 curated theme chips with ThemeKey mapping"
  ```

---

### Task 8: `WizardStep4Pronouns.tsx`

**Files:**
- Create: `components/landing/WizardStep4Pronouns.tsx`

- [ ] **Step 1: Create the component**

  ```typescript
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
  ```

- [ ] **Step 2: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 new errors.

- [ ] **Step 3: Commit**

  ```bash
  git add components/landing/WizardStep4Pronouns.tsx
  git commit -m "feat: WizardStep4Pronouns — He/Him + She/Her cards with submit trigger"
  ```

---

### Task 9: `BookFormWizard.tsx`

**Files:**
- Create: `components/landing/BookFormWizard.tsx`

This is the stateful orchestrator. It manages step progression, collects data from each step, handles the BYOK gate (same logic as `BookForm.tsx`), and submits to `/api/generate`.

- [ ] **Step 1: Create the component**

  ```typescript
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
  ```

- [ ] **Step 2: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 new errors.

- [ ] **Step 3: Commit**

  ```bash
  git add components/landing/BookFormWizard.tsx
  git commit -m "feat: BookFormWizard — 4-step orchestrator with BYOK gate and /api/generate submit"
  ```

---

## Chunk 4: Hero Zone

### Task 10: `BookStrip.tsx` — Auto-scrolling film strip

**Files:**
- Create: `components/landing/BookStrip.tsx`

The strip contains 8 illustrated SVG tile cards. For Phase 1, all tiles are SVG placeholders with hand-drawn illustrated scenes. To swap in real screenshots later: update the `src` prop array — no structural change needed.

- [ ] **Step 1: Create the component**

  ```typescript
  // components/landing/BookStrip.tsx
  // Auto-scrolling horizontal film strip of illustrated book pages.
  // Phase 1: SVG placeholder tiles. Phase 2: swap in real generated page images.

  interface Props {
    images?: string[]   // Optional array of image URLs. If provided, replaces SVG placeholders.
  }

  // 8 SVG illustrated placeholder tiles — each ~148×196px portrait card
  const SVG_TILES = [
    // Tile 1: Jungle scene — child running past giant leaves
    `<svg viewBox="0 0 148 196" xmlns="http://www.w3.org/2000/svg">
      <rect width="148" height="196" fill="#d4edda"/>
      <ellipse cx="74" cy="160" rx="60" ry="20" fill="#a8d5a2" opacity="0.6"/>
      <rect x="20" y="80" width="8" height="100" fill="#5a8a3c" rx="4"/>
      <ellipse cx="24" cy="75" rx="20" ry="25" fill="#7ab648" opacity="0.9"/>
      <rect x="110" y="60" width="8" height="120" fill="#5a8a3c" rx="4"/>
      <ellipse cx="114" cy="55" rx="22" ry="28" fill="#7ab648" opacity="0.9"/>
      <circle cx="74" cy="100" r="22" fill="#fde68a"/>
      <circle cx="74" cy="90" r="14" fill="#f59e0b"/>
      <line x1="74" y1="104" x2="74" y2="140" stroke="#92400e" stroke-width="3"/>
      <line x1="74" y1="115" x2="55" y2="130" stroke="#92400e" stroke-width="3"/>
      <line x1="74" y1="115" x2="93" y2="130" stroke="#92400e" stroke-width="3"/>
      <line x1="74" y1="140" x2="60" y2="165" stroke="#92400e" stroke-width="3"/>
      <line x1="74" y1="140" x2="88" y2="165" stroke="#92400e" stroke-width="3"/>
      <text x="74" y="185" text-anchor="middle" font-size="9" fill="#3d6b30" font-family="sans-serif">Lost in the Jungle</text>
    </svg>`,
    // Tile 2: Space scene — rocket in stars
    `<svg viewBox="0 0 148 196" xmlns="http://www.w3.org/2000/svg">
      <rect width="148" height="196" fill="#1e1b4b"/>
      <circle cx="20" cy="30" r="2" fill="white" opacity="0.8"/>
      <circle cx="50" cy="15" r="1.5" fill="white" opacity="0.6"/>
      <circle cx="100" cy="25" r="2" fill="white" opacity="0.9"/>
      <circle cx="130" cy="10" r="1.5" fill="white" opacity="0.7"/>
      <circle cx="10" cy="80" r="1" fill="white" opacity="0.5"/>
      <circle cx="140" cy="60" r="2" fill="white" opacity="0.8"/>
      <ellipse cx="74" cy="100" rx="18" ry="30" fill="#f59e0b"/>
      <polygon points="74,55 60,85 88,85" fill="#d97706"/>
      <circle cx="74" cy="100" r="8" fill="#bfdbfe" opacity="0.9"/>
      <polygon points="58,125 44,145 62,138" fill="#f97316"/>
      <polygon points="90,125 104,145 86,138" fill="#f97316"/>
      <ellipse cx="74" cy="150" rx="12" ry="20" fill="#fed7aa" opacity="0.5"/>
      <text x="74" y="185" text-anchor="middle" font-size="9" fill="#a5b4fc" font-family="sans-serif">Space Mission</text>
    </svg>`,
    // Tile 3: Dragon on mountain
    `<svg viewBox="0 0 148 196" xmlns="http://www.w3.org/2000/svg">
      <rect width="148" height="196" fill="#fce7f3"/>
      <polygon points="74,30 20,150 128,150" fill="#d1d5db"/>
      <polygon points="74,50 35,150 113,150" fill="#e5e7eb"/>
      <circle cx="90" cy="75" r="25" fill="#a78bfa"/>
      <polygon points="90,50 100,65 80,65" fill="#7c3aed"/>
      <circle cx="83" cy="72" r="4" fill="#fbbf24"/>
      <circle cx="97" cy="72" r="4" fill="#fbbf24"/>
      <path d="M 82 82 Q 90 88 98 82" stroke="#7c3aed" stroke-width="2" fill="none"/>
      <polygon points="110,60 125,45 120,62 135,55" fill="#f59e0b" opacity="0.8"/>
      <text x="74" y="175" text-anchor="middle" font-size="8" fill="#7c3aed" font-family="sans-serif">The Dragon Who</text>
      <text x="74" y="187" text-anchor="middle" font-size="8" fill="#7c3aed" font-family="sans-serif">Was Different</text>
    </svg>`,
    // Tile 4: Ocean scene
    `<svg viewBox="0 0 148 196" xmlns="http://www.w3.org/2000/svg">
      <rect width="148" height="196" fill="#dbeafe"/>
      <rect x="0" y="110" width="148" height="86" fill="#3b82f6" opacity="0.7"/>
      <path d="M 0 110 Q 37 100 74 110 Q 111 120 148 110" fill="#bfdbfe" opacity="0.6"/>
      <rect x="50" y="80" width="50" height="35" fill="#92400e" rx="3"/>
      <polygon points="75,40 50,80 100,80" fill="#fde68a"/>
      <rect x="72" y="50" width="3" height="35" fill="#78350f"/>
      <circle cx="74" cy="90" r="10" fill="#fde68a"/>
      <circle cx="74" cy="82" r="7" fill="#f59e0b"/>
      <text x="74" y="185" text-anchor="middle" font-size="9" fill="#1e40af" font-family="sans-serif">The Great Ocean Voyage</text>
    </svg>`,
    // Tile 5: Castle door
    `<svg viewBox="0 0 148 196" xmlns="http://www.w3.org/2000/svg">
      <rect width="148" height="196" fill="#fef3c7"/>
      <rect x="10" y="40" width="130" height="140" fill="#d1d5db" rx="4"/>
      <rect x="0" y="30" width="45" height="60" fill="#9ca3af"/>
      <rect x="103" y="30" width="45" height="60" fill="#9ca3af"/>
      <rect x="5" y="10" width="10" height="25" fill="#6b7280"/>
      <rect x="20" y="10" width="10" height="25" fill="#6b7280"/>
      <rect x="108" y="10" width="10" height="25" fill="#6b7280"/>
      <rect x="123" y="10" width="10" height="25" fill="#6b7280"/>
      <rect x="50" y="100" width="48" height="80" fill="#7c3aed" rx="24 24 0 0"/>
      <circle cx="90" cy="142" r="5" fill="#f59e0b"/>
      <text x="74" y="190" text-anchor="middle" font-size="9" fill="#92400e" font-family="sans-serif">The Forbidden Door</text>
    </svg>`,
    // Tile 6: Forest path
    `<svg viewBox="0 0 148 196" xmlns="http://www.w3.org/2000/svg">
      <rect width="148" height="196" fill="#d1fae5"/>
      <rect x="0" y="0" width="148" height="130" fill="#6ee7b7" opacity="0.3"/>
      <ellipse cx="30" cy="60" rx="28" ry="35" fill="#059669"/>
      <ellipse cx="118" cy="50" rx="32" ry="40" fill="#059669"/>
      <ellipse cx="74" cy="40" rx="20" ry="28" fill="#34d399"/>
      <path d="M 55 196 Q 74 140 93 196" fill="#fde68a" opacity="0.8"/>
      <circle cx="74" cy="130" r="14" fill="#fde68a"/>
      <circle cx="74" cy="122" r="9" fill="#f59e0b"/>
      <circle cx="30" cy="80" r="5" fill="#fbbf24" opacity="0.8"/>
      <circle cx="118" cy="70" r="4" fill="#fbbf24" opacity="0.8"/>
      <text x="74" y="185" text-anchor="middle" font-size="8" fill="#065f46" font-family="sans-serif">Into the Enchanted Forest</text>
    </svg>`,
    // Tile 7: Hero cape
    `<svg viewBox="0 0 148 196" xmlns="http://www.w3.org/2000/svg">
      <rect width="148" height="196" fill="#fef3c7"/>
      <circle cx="74" cy="55" r="45" fill="#fde68a" opacity="0.5"/>
      <circle cx="74" cy="55" r="30" fill="#f59e0b" opacity="0.3"/>
      <circle cx="74" cy="50" r="16" fill="#fde68a"/>
      <circle cx="74" cy="42" r="10" fill="#f59e0b"/>
      <line x1="74" y1="66" x2="74" y2="110" stroke="#92400e" stroke-width="4"/>
      <path d="M 74 70 Q 50 90 40 110 Q 74 100 108 110 Q 98 90 74 70" fill="#ef4444" opacity="0.9"/>
      <line x1="74" y1="80" x2="50" y2="100" stroke="#92400e" stroke-width="3"/>
      <line x1="74" y1="80" x2="98" y2="100" stroke="#92400e" stroke-width="3"/>
      <line x1="74" y1="110" x2="58" y2="145" stroke="#92400e" stroke-width="3"/>
      <line x1="74" y1="110" x2="90" y2="145" stroke="#92400e" stroke-width="3"/>
      <text x="74" y="175" text-anchor="middle" font-size="9" fill="#92400e" font-family="sans-serif">Everyday Hero</text>
    </svg>`,
    // Tile 8: Unlikely friends — child and small animal
    `<svg viewBox="0 0 148 196" xmlns="http://www.w3.org/2000/svg">
      <rect width="148" height="196" fill="#fef9c3"/>
      <ellipse cx="74" cy="165" rx="65" ry="15" fill="#fde68a" opacity="0.4"/>
      <circle cx="90" cy="80" r="16" fill="#fde68a"/>
      <circle cx="90" cy="72" r="10" fill="#f59e0b"/>
      <line x1="90" y1="96" x2="90" y2="135" stroke="#92400e" stroke-width="3"/>
      <line x1="90" y1="108" x2="75" y2="122" stroke="#92400e" stroke-width="3"/>
      <line x1="90" y1="108" x2="105" y2="122" stroke="#92400e" stroke-width="3"/>
      <line x1="90" y1="135" x2="80" y2="160" stroke="#92400e" stroke-width="3"/>
      <line x1="90" y1="135" x2="100" y2="160" stroke="#92400e" stroke-width="3"/>
      <ellipse cx="50" cy="128" rx="16" ry="12" fill="#fbbf24"/>
      <circle cx="50" cy="116" r="10" fill="#f59e0b"/>
      <ellipse cx="44" cy="110" rx="5" ry="8" fill="#f59e0b"/>
      <ellipse cx="56" cy="110" rx="5" ry="8" fill="#f59e0b"/>
      <circle cx="47" cy="116" r="2" fill="#1c1917"/>
      <circle cx="53" cy="116" r="2" fill="#1c1917"/>
      <text x="74" y="185" text-anchor="middle" font-size="9" fill="#92400e" font-family="sans-serif">The Unexpected Friend</text>
    </svg>`,
  ]

  export function BookStrip({ images }: Props) {
    // If real images are provided, use them; otherwise use SVG placeholders
    const tiles = images && images.length > 0 ? images : SVG_TILES.map(svg =>
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    )

    // Duplicate tiles for seamless infinite scroll
    const allTiles = [...tiles, ...tiles]

    return (
      <div className="relative w-full overflow-hidden py-4">
        {/* Fade masks — left and right */}
        <div
          className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgb(255,251,245), transparent)',
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to left, rgb(255,251,245), transparent)',
          }}
        />

        {/* Scrolling strip */}
        <div
          className="flex gap-4 w-max animate-scroll-left"
          style={{ willChange: 'transform' }}
        >
          {allTiles.map((src, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[148px] h-[196px] rounded-2xl overflow-hidden shadow-md shadow-amber-100 border border-amber-100"
            >
              <img
                src={src}
                alt=""
                aria-hidden="true"
                width={148}
                height={196}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 new errors.

- [ ] **Step 3: Commit**

  ```bash
  git add components/landing/BookStrip.tsx
  git commit -m "feat: BookStrip — auto-scrolling SVG placeholder tile strip with real-image swap support"
  ```

---

### Task 11: `StickyCTA.tsx`

**Files:**
- Create: `components/landing/StickyCTA.tsx`

- [ ] **Step 1: Create the component**

  ```typescript
  'use client'

  // components/landing/StickyCTA.tsx
  // Fixed pill at bottom of viewport — scrolls user to wizard

  export function StickyCTA() {
    const scrollToWizard = () => {
      const el = document.getElementById('wizard')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <button
          onClick={scrollToWizard}
          className="
            pointer-events-auto
            bg-[#2d1a06] text-amber-400
            font-fredoka text-base
            rounded-full px-6 py-3
            shadow-lg shadow-amber-900/20
            hover:bg-[#3d2a14] active:scale-95
            transition-all
          "
        >
          ✦ Make a free book
        </button>
      </div>
    )
  }
  ```

- [ ] **Step 2: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 new errors.

- [ ] **Step 3: Commit**

  ```bash
  git add components/landing/StickyCTA.tsx
  git commit -m "feat: StickyCTA — fixed dark pill CTA that scrolls to wizard"
  ```

---

### Task 12: `HeroSection.tsx`

**Files:**
- Create: `components/landing/HeroSection.tsx`

This is the largest UI component — brand mark, two-line headline, tagline, trust chips, BookStrip, CTA button, scroll nudge, and wavy SVG divider.

- [ ] **Step 1: Create the component**

  ```typescript
  // components/landing/HeroSection.tsx
  // Above-fold hero: brand mark, headline, tagline, trust chips, film strip, CTA, divider

  import { BookStrip } from './BookStrip'

  export function HeroSection() {
    return (
      <section
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #fffbf5 0%, #fef3c7 40%, #fde8c8 100%)',
        }}
      >
        {/* Illustrated SVG background scatter */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
          {/* Stars */}
          <svg className="absolute top-[8%] left-[7%] w-8 h-8 text-amber-300 opacity-30" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
          <svg className="absolute top-[15%] right-[12%] w-5 h-5 text-amber-400 opacity-20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
          <svg className="absolute bottom-[25%] left-[5%] w-6 h-6 text-amber-300 opacity-25" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
          {/* Moon */}
          <svg className="absolute top-[5%] right-[6%] w-10 h-10 text-amber-300 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          {/* Open book */}
          <svg className="absolute top-[30%] right-[4%] w-14 h-14 text-amber-400 opacity-15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          {/* Sparkle cluster */}
          <svg className="absolute bottom-[30%] right-[8%] w-12 h-12 text-amber-500 opacity-15" viewBox="0 0 48 48" fill="currentColor">
            <circle cx="24" cy="6" r="3"/>
            <circle cx="42" cy="24" r="3"/>
            <circle cx="24" cy="42" r="3"/>
            <circle cx="6" cy="24" r="3"/>
            <circle cx="38" cy="10" r="2"/>
            <circle cx="38" cy="38" r="2"/>
            <circle cx="10" cy="38" r="2"/>
            <circle cx="10" cy="10" r="2"/>
          </svg>
          {/* Wavy lines */}
          <svg className="absolute top-[45%] left-[2%] w-20 h-6 text-amber-300 opacity-20" viewBox="0 0 80 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M0 12 Q10 4 20 12 Q30 20 40 12 Q50 4 60 12 Q70 20 80 12"/>
          </svg>
        </div>

        {/* Content column */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-4 max-w-2xl mx-auto">

          {/* Brand mark */}
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 rounded-full px-4 py-2 font-fredoka text-base mb-8 shadow-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
            Inklings
          </div>

          {/* Headline — two-line mixed type */}
          <h1 className="flex flex-col items-center gap-1 mb-4">
            <span className="font-fredoka text-5xl md:text-6xl text-[#2d1a06] font-normal leading-none">
              A book made
            </span>
            <span
              className="font-caveat text-5xl md:text-6xl text-amber-600 font-semibold"
              style={{ transform: 'rotate(-1.5deg)', display: 'inline-block' }}
            >
              just for them.
              {/* Hand-drawn squiggle underline */}
              <svg
                className="w-full mt-[-4px]"
                viewBox="0 0 280 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M2 8 Q20 2 40 8 Q60 14 80 8 Q100 2 120 8 Q140 14 160 8 Q180 2 200 8 Q220 14 240 8 Q260 2 278 8"
                  stroke="#d97706"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
          </h1>

          {/* Tagline */}
          <p className="font-nunito text-base md:text-lg text-amber-800 font-semibold max-w-md mb-6">
            Personalized illustrations. Their reading level. Ready in about 3 minutes.
          </p>

          {/* Trust chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            {[
              { icon: '📚', label: '3 free books' },
              { icon: '✨', label: 'No account needed' },
              { icon: '🎯', label: 'Matched to their reading level' },
            ].map(chip => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 font-nunito text-sm font-semibold rounded-full px-4 py-1.5"
              >
                {chip.icon} {chip.label}
              </span>
            ))}
          </div>
        </div>

        {/* Film strip — full width */}
        <div className="relative z-10 w-full mb-8">
          <BookStrip />
        </div>

        {/* CTA + sub-note */}
        <div className="relative z-10 flex flex-col items-center gap-3 pb-8">
          <a
            href="#wizard"
            className="
              inline-block bg-gradient-to-r from-amber-500 to-amber-600 text-white
              font-fredoka text-xl rounded-2xl py-4 px-10
              hover:from-amber-600 hover:to-amber-700
              shadow-lg shadow-amber-300/40
              transition-all active:scale-[0.98]
            "
          >
            Make their book ✦
          </a>
          <p className="font-nunito text-xs text-amber-700/60">
            3 free books · no account · ready in minutes
          </p>

          {/* Scroll nudge */}
          <div className="mt-4 flex flex-col items-center gap-1 opacity-40">
            <span className="font-caveat text-sm text-amber-800">scroll down to start</span>
            <svg className="w-5 h-5 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* Wavy SVG divider — transitions hero to wizard zone */}
        <div className="absolute bottom-0 left-0 right-0 z-10" aria-hidden="true">
          <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 md:h-20">
            <path
              d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
              fill="white"
            />
          </svg>
        </div>
      </section>
    )
  }
  ```

- [ ] **Step 2: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 new errors.

- [ ] **Step 3: Commit**

  ```bash
  git add components/landing/HeroSection.tsx
  git commit -m "feat: HeroSection — illustrated hero with brand mark, mixed headline, film strip, wavy divider"
  ```

---

## Chunk 5: Integration

### Task 13: Replace `app/page.tsx` with the two-zone landing layout

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx` entirely**

  ```typescript
  // app/page.tsx — Inklings landing page: hero + 4-step wizard

  import { HeroSection }    from '@/components/landing/HeroSection'
  import { BookFormWizard } from '@/components/landing/BookFormWizard'
  import { StickyCTA }      from '@/components/landing/StickyCTA'

  export default function HomePage() {
    return (
      <main className="min-h-screen bg-white">
        {/* Zone 1: Hero (above fold) */}
        <HeroSection />

        {/* Zone 2: Wizard (below fold) */}
        <section
          className="relative bg-white px-6 py-16"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #fffbf5 100%)',
          }}
        >
          {/* Low-opacity SVG scatter — mirrors hero density */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <svg className="absolute top-8 left-8 w-6 h-6 text-amber-300 opacity-20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
            <svg className="absolute bottom-8 right-8 w-8 h-8 text-amber-400 opacity-15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
          </div>
          <BookFormWizard />
          <p className="text-center font-nunito text-xs text-amber-700/40 mt-8">
            Shareable link stays active for 30 days · No email required
          </p>
        </section>

        <StickyCTA />
      </main>
    )
  }
  ```

- [ ] **Step 2: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 new errors.

- [ ] **Step 3: Build check**

  ```bash
  npm run build
  ```

  Expected: Successful build with 0 errors. Warnings about unused vars in legacy code are acceptable.

- [ ] **Step 4: Visual verification — start dev server and inspect**

  ```bash
  npm run dev
  ```

  Open `http://localhost:3000` in a browser. Verify:
  - [ ] Hero zone fills 100vh, warm amber gradient background
  - [ ] Brand mark shows "Inklings" with star icon
  - [ ] Headline shows two-line mixed type (Fredoka + Caveat)
  - [ ] Three trust chips visible
  - [ ] Film strip auto-scrolls continuously
  - [ ] Fade masks on both edges of film strip
  - [ ] CTA button "Make their book ✦" present
  - [ ] Wavy divider between hero and wizard zone
  - [ ] Wizard card visible below fold with star corner accents
  - [ ] Step dots animate correctly through all 4 steps
  - [ ] Step 1: Name input uses Caveat font, pencil emoji suffix
  - [ ] Step 2: Age tiles 3-8 (not 9, 10, 11, 12), reading mode toggle for ages 5+
  - [ ] Step 3: 10 theme chips in 2-column grid
  - [ ] Step 4: He/Him + She/Her cards, submit button
  - [ ] Sticky dark pill visible at bottom of viewport
  - [ ] Sticky pill scroll-to-wizard works
  - [ ] Fonts loaded: Fredoka One (display), Caveat (handwritten), Nunito (body)
  - [ ] CTA anchor link scrolls to wizard section

- [ ] **Step 5: Commit**

  ```bash
  git add app/page.tsx
  git commit -m "feat: replace landing page with two-zone HeroSection + BookFormWizard layout"
  ```

---

### Task 14: Final verification and cleanup

- [ ] **Step 1: Run TypeScript full check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 new errors introduced by this feature branch. Note any pre-existing errors in `BookForm.tsx` (dead code) — they are acceptable.

- [ ] **Step 2: Run lint**

  ```bash
  npm run lint
  ```

  Fix any lint errors in the new files (`components/landing/`). Legacy file warnings are acceptable.

- [ ] **Step 3: Confirm all 8 landing components exist**

  ```bash
  ls components/landing/
  ```

  Expected:
  ```
  BookFormWizard.tsx
  BookStrip.tsx
  HeroSection.tsx
  StickyCTA.tsx
  WizardStep1Name.tsx
  WizardStep2Age.tsx
  WizardStep3Theme.tsx
  WizardStep4Pronouns.tsx
  ```

- [ ] **Step 4: End-to-end smoke test — full book generation**

  With dev server running:
  1. Navigate to `http://localhost:3000`
  2. Enter a child name in Step 1
  3. Select age 6 in Step 2
  4. Toggle reading mode to "They'll read it"
  5. Select a theme in Step 3
  6. Select She/Her in Step 4
  7. Click "Make their book ✦"
  8. Verify navigation to `/generating?uuid=...`
  9. Verify book generates successfully (or fails gracefully with an error message)

- [ ] **Step 5: Final commit**

  ```bash
  git add .
  git commit -m "feat: Inklings landing page redesign complete — hero + 4-step wizard + readMode"
  ```

---

## Deferred (Phase 2 — Do Not Implement Now)

- Free-text theme input on Step 3
- They/Them pronoun option on Step 4
- Tiers 4 and 5 (ages 9–12) in the wizard
- DIBELS/DRA/F&P reading score input
- Sticky pill auto-hide when wizard scrolls into view
- Real generated book screenshots in the film strip (swap in by updating `BookStrip` `images` prop)
- `BookForm.tsx` and `ThemeSuggestions.tsx` cleanup

---

## Reference

- Spec: `docs/superpowers/specs/2026-03-12-landing-page-redesign.md`
- Mockup: `mockup-landing-v2.html` (in project root)
- Fonts: [Fredoka One](https://fonts.google.com/specimen/Fredoka+One), [Caveat](https://fonts.google.com/specimen/Caveat), [Nunito](https://fonts.google.com/specimen/Nunito)
