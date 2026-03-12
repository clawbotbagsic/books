# Inklings — Landing Page Redesign
**Date:** 2026-03-12
**Status:** Approved
**Scope:** Full redesign — hero + wizard in one deploy

---

## Summary

Replace the current minimal landing page (flat amber hero + Google-Doc-style form) with a two-zone scrollable page: an illustrated hero with an auto-scrolling book film strip above the fold, and a 4-step playful wizard below the fold. Product name confirmed as **Inklings**. Tiers 1–3 only (ages 3–8).

---

## Zone 1 — Hero (above fold)

### Layout
Single column, centered. Fills 100vh on iPad landscape. Background: warm amber-to-peach gradient with hand-drawn SVG illustrated elements at low opacity (stars, moons, open book, sparkle clusters, wavy lines). No nav bar.

### Elements (top to bottom)

**Brand mark** — amber pill with star icon, Fredoka One font, "Inklings" (replaces "Story Spark" everywhere in the codebase — app/page.tsx, layout.tsx, any remaining references)

**Headline** — two-line mixed type:
- Line 1: "A book made" — Fredoka One, heavy weight
- Line 2: "just for them." — Caveat (handwritten font), amber, -1.5deg rotation, hand-drawn squiggle underline

**Tagline** — "Personalized illustrations. Their reading level. Ready in about 3 minutes." — Nunito, muted amber-brown

**Trust chips** — three pill badges:
- 📚 3 free books
- ✨ No account needed
- 🎯 Matched to their reading level

**Film strip** — full-width auto-scrolling strip of 8 book page tiles (seamless infinite loop via CSS `@keyframes translate` with duplicate tile set). Slow, continuous left scroll. Fade-out masks on both edges via `::before`/`::after` CSS gradients. No controls. Tiles are portrait cards (~148×196px) with illustrated SVG scenes (placeholders until real screenshots are available). Swap to real generated page images by updating `src` props — no structural change needed.

**CTA button** — "Make their book ✦" — large rounded amber gradient button, Fredoka One. Anchor-scrolls to wizard section.

**Sub-note** — "3 free books · no account · ready in minutes"

**Scroll nudge** — Caveat font, "scroll down to start" with chevron, low opacity

### Wavy SVG divider
SVG path transitions hero to wizard zone — eliminates flat horizontal cut.

---

## Zone 2 — Wizard (below fold)

### Layout
White/warm background, centered card, max-width 560px. Illustrated star accents in card corners. Matching background scatter of low-opacity illustrated SVGs.

### Step indicator
4 dots — active dot expands to a pill (width 28px, amber fill). Nunito font step label above card: "✦ Step X of 4 — [hint text]"

---

### Step 1 — Name

**Question:** "What's your child's name?"
**Hint:** "Their name will be woven into the whole story ✦"
**Input:** Caveat font, large (36px), borderless except bottom border (amber), pencil emoji suffix
**Placeholder:** "Landon…"
**Max length:** 20 characters
**Button:** "Next up — how old are they? →"

---

### Step 2 — Age + Reading Mode

**Question:** "How old are they?"
**Hint:** "We'll match the book to their reading level"

**Age tiles:** Tappable rounded cards for ages **3 through 8 only** (Tiers 1–3). Selected tile gets amber border + fill. Each tile shows the number in Fredoka One.

**Tier label** (updates on selection):
- Ages 3–4 → "Pre-Reader · 12 pages · We'll read this one together ✦" (no toggle — locked to aloud; WizardStep2 automatically emits `readMode: 'aloud'` for this age range)
- Ages 5–6 → "Early Reader · 14 pages" + reading mode toggle (default: together)
- Ages 7–8 → "Developing Reader · 20 pages" + reading mode toggle (default: independent)

**Reading mode toggle** (ages 5–8 only):
Two small illustrated cards beneath age tiles:
- 🤝 "We'll read it together" → sets `readMode: 'aloud'`
- 📖 "They'll read it" → sets `readMode: 'independent'`

This flag adjusts the story system prompt: `aloud` produces slightly richer prose satisfying to read aloud; `independent` enforces strict Dolch/Fry vocabulary and repetitive confidence-building patterns.

**Button:** "Next — what's the adventure? →"

---

### Step 3 — Theme

**Question:** "What's the adventure?"
**Hint:** "Pick the world they'll step into"

**10 illustrated theme chips** (no free text input — Phase 1 is constrained):

| # | Chip | Hook Pattern | SEL Dimension |
|---|------|-------------|--------------|
| 1 | 🦕 Lost in the Jungle | Discovery | Persistence, problem-solving |
| 2 | 🚀 Space Mission | Quest/Mission | Teamwork, courage |
| 3 | 🐉 The Dragon Who Was Different | Transformation | Being yourself, belonging |
| 4 | 🌊 The Great Ocean Voyage | Journey | Friendship, cooperation |
| 5 | 🏰 The Forbidden Door | Dare/Forbidden | Listening, consequences, forgiveness |
| 6 | 🌲 Into the Enchanted Forest | New World | Curiosity, wonder, trust |
| 7 | 🦸 Everyday Hero | Quest/Mission | Empathy, helping others |
| 8 | 🐾 The Unexpected Friend | Discovery | Kindness, seeing past differences |
| 9 | ⭐ The Wishing Star | Journey | Hope, patience, gratitude |
| 10 | 🌪️ Before the Storm | Quest/Mission | Courage, family bonds, facing fear |

Hook patterns sourced from Pratham Books / StoryWeaver CC-BY corpus and public domain adventure structures (Peter Rabbit, My Father's Dragon, Wizard of Oz, Thornton Burgess). SEL dimensions emerge from the adventure rather than being stated as lessons — Daniel Tiger narrative structure (situation → strategy → modeling → resolution).

Free-text theme input is Phase 2+.

**Button:** "Almost there — one last thing →"

---

### Step 4 — Pronouns

**Question:** "What are their pronouns?"
**Hint:** "We'll use these throughout their story"

**Two large cards:**
- He / Him
- She / Her

Selected card gets amber border + checkmark. They/Them deferred to Phase 2.

**Submit button:** "Make their book ✦" (triggers generation, navigates to `/generating`)

---

## Sticky Pill

Fixed to bottom of viewport, always visible during scroll. Dark (near-black) pill, amber text: "✦ Make a free book". Anchor-scrolls to wizard. Disappears once wizard is in view (Phase 2 nice-to-have — Phase 1 it just stays visible).

---

## Typography

| Use | Font | Weight |
|-----|------|--------|
| Brand mark, headlines, buttons | Fredoka One | Regular (display font) |
| Handwritten accent (headline line 2, labels) | Caveat | 600–700 |
| Body, hints, chips, trust copy | Nunito | 600–900 |

All three fonts loaded from Google Fonts.

---

## Color Palette

| Token | Value | Use |
|-------|-------|-----|
| `amber-50` | `#fffbf5` | Page background |
| `amber-100` | `#fef3c7` | Brand pill, chip bg |
| `amber-300` | `#fcd34d` | Input border, step dots |
| `amber-500` | `#f59e0b` | Active states, CTA gradient start |
| `amber-600` | `#d97706` | CTA gradient end, headline accent |
| `amber-800` | `#78350f` | Muted text, hint copy |
| `warm-dark` | `#2d1a06` | Primary text |
| White | `#ffffff` | Card bg, tile borders |

---

## Component Breakdown

### New files
- `components/landing/HeroSection.tsx` — brand mark, headline, tagline, trust chips, film strip, CTA
- `components/landing/BookStrip.tsx` — the auto-scrolling tile strip (accepts `images: string[]` prop, falls back to illustrated SVG placeholders)
- `components/landing/BookFormWizard.tsx` — 4-step wizard, manages step state internally
- `components/landing/WizardStep1Name.tsx`
- `components/landing/WizardStep2Age.tsx` — includes reading mode toggle
- `components/landing/WizardStep3Theme.tsx` — 10 theme chips
- `components/landing/WizardStep4Pronouns.tsx`
- `components/landing/StickyCTA.tsx`

### Modified files
- `app/page.tsx` — replaced with `<HeroSection />` + `<BookFormWizard />`
- `lib/types/index.ts` (or `types/index.ts`) — add `readMode: 'aloud' | 'independent'` to `BookInput`
- `lib/anthropic.ts` — use `readMode` to set prose register in system prompt
- `components/form/BookForm.tsx` — kept but no longer used by home page; can be removed in Phase 2 cleanup

### Deleted files
- None in Phase 1 — `BookForm.tsx` stays as dead code until confirmed safe to remove

---

## Backend Changes

### `types/index.ts`
Add `readMode: 'aloud' | 'independent'` to `BookInput` interface.

### `lib/anthropic.ts`
Add conditional prose register block to system prompt:
```
readMode === 'aloud'
  → "Write in a read-aloud register: slightly richer prose, atmospheric descriptions,
     sentences that have satisfying rhythm when spoken aloud. Vocabulary may slightly
     exceed the child's decoding level since the parent is reading."
readMode === 'independent'
  → "Write in an independent-reader register: strict adherence to sight word vocabulary,
     short confidence-building sentences, repetitive patterns that reward completion."
```

### `types/index.ts`
Add `readMode: 'aloud' | 'independent'` to `BookFormInput` interface (required field, not optional — WizardStep2 always emits it; ages 3–4 automatically emit `'aloud'`, ages 5–8 emit whichever the toggle is set to).

### `app/api/generate/route.ts`
Add `readMode: z.enum(['aloud', 'independent'])` to `RequestSchema` zod object. Pass `readMode` from validated input through to `generateStory()` call.

---

## Data Flow

```
WizardStep1 → name: string
WizardStep2 → age: number, readMode: 'aloud' | 'independent'
WizardStep3 → theme: ThemeKey (one of 10 enum values)
WizardStep4 → pronouns: 'he/him' | 'she/her'
     ↓
BookFormWizard.onSubmit() → POST /api/generate
     ↓
generateStory(input) → tier derived from age, readMode adjusts prose register
     ↓
/generating page (existing animated progress screen)
```

---

## Deferred / Phase 2

- Free-text theme input
- They/Them pronoun option
- Tiers 4 and 5 (ages 9–12)
- DIBELS / DRA / F&P reading score input on Step 2
- Sticky pill auto-hide when wizard is in view
- Real generated book screenshots in the film strip (swap in after first successful test generation)
- `BookForm.tsx` cleanup

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-12 | Product name: Inklings | Confirmed by Kevin. Ink + lings + inkling = three meanings stacked. |
| 2026-03-12 | Tiers 1–3 only (ages 3–8) | Tiers 4–5 = 28–32 images/book, too costly for free tier at current Replicate pricing |
| 2026-03-12 | No free-text theme input | 10 curated themes produce better-structured stories; free text is Phase 2 |
| 2026-03-12 | They/Them deferred | Simplifies Phase 1 UX; revisit in Phase 2 |
| 2026-03-12 | readMode toggle on age step (not a separate step) | Keeps wizard at 4 steps; toggle is contextually relevant at the age step |
| 2026-03-12 | 10 themes from public domain adventure hooks | Pratham/StoryWeaver CC-BY corpus + Peter Rabbit/Oz/My Father's Dragon source DNA |
| 2026-03-12 | DIBELS/DRA score input deferred to Phase 2 | Phase 2 feature: parents enter school reading score to get precision-calibrated tier |
