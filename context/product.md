# Product Context — Inklings (books.tunedfor.ai)

> Last updated: 2026-03-12
> Status: LOCKED — Phase 1 Spec

---

## Identity

**Product name:** Inklings
**Subdomain:** books.tunedfor.ai
**One-line description:** Generate a personalized, illustrated children's book in under 3 minutes.
**Tagline:** A personalized book, just for them.

---

## Problem & Solution

**The problem:**
Parents want to read personalized, meaningful books with their children, but generic store-bought books don't use the child's name, reflect their interests, or match their reading level. Custom children's books from services like Wonderbly are expensive ($30-50+), slow to ship, and static once printed.

**The solution:**
An AI-powered web app that generates a personalized, illustrated children's book tailored to the child's name, age, reading level, and chosen theme. Page count scales by reading level (12-32 pages). Delivered instantly as an on-screen reader. First 3 books free.

**Why now / why us:**
Claude Opus 4.6 and the fofr/consistent-character model on Replicate are capable enough to produce character-consistent, charming illustrations and age-appropriate prose. The cost per book is low enough to offer a real free tier. No competitor offers instant, personalized, reading-level-appropriate illustrated books with character-consistent illustrations at this quality and price point.

---

## Target User

**Primary user:**
- Who they are: Parents of children ages 3-8 (Phase 1). Most likely 28-42 years old. Gift-giving mindset (bedtime, special occasions) or supplementing home reading.
- Device / context: iPad, landscape orientation, at home. Often used at bedtime with child present.
- Key motivation: Make reading feel special and personal for their child.
- Technical comfort level: Consumer-level. Can follow simple instructions but will not debug API keys without clear guidance.

**Secondary user (if any):**
Teachers and librarians discovering the tool for classroom personalization. Not targeted in Phase 1 but not excluded.

---

## Core Mechanics

> The 5-tier Lexile system is the core IP. It is what makes the generated text developmentally appropriate rather than just "for kids."

**Primary input:**
4-field form — child's name, child's age (3-12), book theme/topic (free text with suggestions), child's pronouns (he/him, she/her, they/them — defaults to they/them).

**What happens:**
Two-pass AI generation.

Pass 1 — Story Generation (Claude Opus 4.6):
System prompt encodes the Lexile tier constraints (words per page, total word range, sentence complexity, vocabulary grade level, target page count) for the selected tier, the child's inputs, and a JSON output schema. Claude returns a variable-length story as structured JSON (12-32 pages depending on tier). Each page object contains: `page_number`, `text`, `image_prompt`. Claude writes a shared physical character description and appends it to every image prompt for visual consistency. JSON is validated; one retry on malformed output.

Pass 2 — Image Generation (Replicate — fofr/consistent-character + FLUX Schnell):
Two-phase generation. Phase 1: Generate a character anchor image from `character_description` using FLUX Schnell (one call per book). Phase 2: For each page, call fofr/consistent-character with the anchor as `subject` reference + page `image_prompt`. This produces character-consistent illustrations across all pages. Pages generated in batches of 3. Images stored in Supabase Storage tied to book UUID.

Completed book stored in Supabase as JSON record keyed to UUID. Accessible at books.tunedfor.ai/book/[uuid] for 30 days, then purged.

**Primary output:**
An illustrated children's book (12-32 pages, length scales with reading level) displayed in a full-bleed reader (iPad landscape). Shareable link valid for 30 days.

**Key parameters / variables:**

The 5 Lexile Tiers (CORRECTED 2026-03-12 — benchmarked against actual early reader books, not parent read-alouds):

| Tier | Name | Lexile Range | Age | Pages | Total Words | Words/Page | Sentence Rules |
|------|------|-------------|-----|-------|-------------|------------|----------------|
| 1 | Pre-Reader | BR-100L | 3-4 | 12 | 30-80 | 3-6 each | SVO only. 80-90% one-syllable. High repetition. |
| 2 | Early Reader | 100-300L | 5-6 | 14 | 50-150 | 3-10 each | Dolch/Fry + CVC words. 80-90% one-syllable. Repetitive patterns. No dialogue. |
| 3 | Developing Reader | 300-500L | 7-8 | 20 | 200-500 | 10-25 each | Blends + two-syllable OK. 65-75% one-syllable. Dialogue encouraged. |
| 4 | Fluent Reader | 500-700L | 9-10 | 28 | 500-1,200 | 20-50 each | PHASE 2+ ONLY — deferred for cost reasons |
| 5 | Advanced | 700-900L | 11-12 | 32 | 800-2,000 | 30-70 each | PHASE 2+ ONLY — deferred for cost reasons |

**Phase 1 active tiers: 1, 2, 3 only (ages 3–8).** Tiers 4 and 5 deferred — 28-32 images/book is too costly at current Replicate pricing to offer in free tier. Age input in wizard capped at 3–8.

Validation benchmarks: Tier 2 (Landon) → ~14 pages, ~80 words, ~6 words/page. Tier 3 (Baylor) → ~20 pages, ~300 words, ~15 words/page.

Age-to-tier default mapping (Phase 1): Age 3-4 → Tier 1, Age 5-6 → Tier 2, Age 7-8 → Tier 3. Parent can nudge up or down one tier before generating.

---

## User Flows

**Flow 1 — Book Creation:**
1. Parent lands on books.tunedfor.ai. Hero CTA: "Create a Free Book."
2. Parent fills out 4-field form: child's name, age, theme/topic, pronouns.
3. System shows the auto-selected Lexile tier by name (e.g., "Developing Reader — Ages 7-8") with a short friendly description. Parent can nudge tier up or down one level.
4. Parent taps "Create My Book."
5. If book 4+ and no BYOK keys stored: BYOK modal appears before generation starts.
6. Progress screen with live status: "Writing your story... Illustrating page 1 of N..." (updates as each image completes, N = page count for their tier).
7. Reader loads automatically when generation is complete.
8. Reader: single-page view, illustration left, text right, tap/swipe to navigate, page counter at bottom center.
9. "Save this link" banner: 30-day URL + copy-to-clipboard button. Message: "Save this link — your book lives here for 30 days."

**Flow 2 — BYOK Setup:**
1. Parent taps gear icon (top-right, always visible).
2. Settings drawer slides in from the right.
3. Two fields: Anthropic API Key, Replicate API Token.
4. Helper text: "Your key stays on your device. We never see it."
5. Links: "Get a free Anthropic key" and "Get a Replicate API token" (open in new tab).
6. Parent saves. Keys stored in localStorage. Drawer closes.
7. On invalid key: next generation fails gracefully with a specific error message naming which key failed and linking back to Settings.

**Flow 3 — Returning to a Book:**
1. Parent opens a saved books.tunedfor.ai/book/[uuid] link.
2. Reader loads directly — no form, no gate.
3. If UUID is expired (30 days): friendly message "This book has expired. Create a new one!" with CTA back to the form.

---

## Monetization

**Free tier:** 3 books generated on Tuned For's Anthropic + Replicate API keys. No account required. No credit card.

**Paid tier / BYOK trigger:** Book 4+ requires the parent to enter their own Anthropic and Replicate API keys. Keys stored in localStorage only. Never sent to Tuned For servers.

**Free tier counter:** Anonymous UUID in localStorage. Counter stored in Supabase against that UUID. Counter increments when Pass 1 (story text) completes successfully. Increment is not triggered by image generation success/failure.

**BYOK gate UX:** After book 3 is delivered, the next "Create" attempt surfaces a modal: "You've used your 3 free books. Add your own API keys to keep creating." Non-punishing — user can dismiss and return. Settings drawer is always accessible via gear icon.

**Future upsells (Phase 2+):**
- Print-quality PDF download (one-time purchase per book, ~$1-3 via Stripe)
- Saved library (account feature)
- Physical book fulfillment (Phase 3, third-party print-on-demand)
- Art style selection (Phase 2)

**Future input enrichment (Phase 2+):**
- Reading assessment score input: allow parents to enter their child's actual DIBELS score, DRA level, F&P level, or Lexile score instead of (or alongside) age to calibrate the tier with precision. Many parents receive these scores from school but have no way to act on them. This turns a confusing test result into a personalized book — a strong differentiator and a natural SEO hook (parents searching "what is my child's DIBELS score" or "DRA level 16 what books"). Wizard UI note: Phase 1 wizard uses age → tier mapping; Phase 2 adds an optional "I have a reading score" expander on the age step.

---

## API Cost Model

| Component | Model | Cost | Unit |
|-----------|-------|------|------|
| Claude Opus 4.6 — story generation | claude-opus-4-6 | ~$0.10 | Per book (~3,200 input + ~3,500 output tokens at $5/$25 per MTok) |
| Replicate — character anchor | FLUX Schnell | ~$0.025 | Per book (one call) |
| Replicate — page illustrations | fofr/consistent-character | ~$0.039 | Per image (~$0.55 for 14 pages / ~$0.78 for 20 pages) |
| Supabase Storage — image hosting | — | ~$0.01 | Per book (~2MB/image, negligible at Phase 1 volume) |
| Supabase DB — book record | — | Negligible | Free tier covers Phase 1 volume |

**Cost per book by tier:**
- Tier 2 (Early Reader, 14 pages): $0.10 story + $0.025 anchor + 14 × $0.039 = **~$0.67**
- Tier 3 (Developing, 20 pages): $0.10 story + $0.025 anchor + 20 × $0.039 = **~$0.90**

**vs. old Ideogram stack:** $0.003 story + 10 × $0.08 = ~$0.80/book (worse quality, no character consistency)
**vs. Segmind Neolemon V3:** 16 × $0.58 = ~$9.28/book → Replicate is 13-14× cheaper

**Cost per free user (Tuned For keys):** ~$0.67-0.90 per book. 3 free books = ~$2.00-2.70 per user acquisition cost.
**Cost at BYOK threshold:** $0.00 to Tuned For — user pays their own API costs.
**Free tier economics:** Strong. At 100 new users/month ≈ $200-270/month in API costs. Reassess if volume spikes.

---

## Market Context

**Size:** US children's book market ~$2.6B. Personalized children's books (Wonderbly, Hooray Heroes) = ~$200M niche. Digital-first personalized is nearly unclaimed.

**Closest competitors:**
- Wonderbly ($34-50, slow ship, static, no reading level targeting)
- Hooray Heroes (similar price, photo-based, not AI)
- Various AI story generators (text only, no illustrations, no reading level targeting)

**Why they fall short:**
No competitor combines instant delivery + personalized illustrations + reading-level-appropriate text in one product.

**Our edge:**
The 5-tier Lexile system makes this educationally defensible, not just cute. Parents who care about reading development will recognize the value. The free tier removes all friction.

---

## Build Phases

**Phase 0 (existing):** Nothing. Blank repo.

**Phase 1 (MVP):**
- 4-field input form
- 5-tier Lexile system with age-to-tier mapping and parent nudge
- Two-pass generation (Claude story JSON + Replicate images)
- On-screen reader (full-bleed, iPad landscape)
- 30-day shareable link
- Free tier counter (3 books, anonymous UUID)
- BYOK settings drawer (Anthropic + Replicate keys)
- Progress screen with live status

**Phase 2 (refinement):**
- PDF export (Stripe one-time purchase)
- Art style selection (2-3 options)
- Story text preview before image generation
- User accounts + saved library

**Phase 3 (growth):**
- Physical book fulfillment (print-on-demand integration)
- Custom character photo upload
- Multi-language support
- Classroom/teacher features

---

## Open Questions

> All gaps resolved. No blocking open questions for Phase 1.

- RESOLVED: Product name is "Inklings" — confirmed by Kevin 2026-03-12.
- RESOLVED: All 20 developer gaps identified and closed. See Decisions Log.

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-11 | Book format: 10 pages, 1 illustration + 1-4 sentences per page | Universal picture book format. Keeps generation cost ~$1/book. |
| 2026-03-11 | 5 Lexile tiers defined: Emerging (100-300L), Beginning (300-500L), Developing (500-700L), Fluent (700-900L), Advanced (900-1100L) | Maps to K-6 reading progression. Standard Lexile ranges. |
| 2026-03-11 | Parent inputs: child name, age, theme, pronouns (4 fields max) | More fields kills completion rate. Age drives tier selection automatically. |
| 2026-03-11 | Age auto-selects tier; parent can nudge ±1 | Parents don't know Lexile numbers. Age-based default removes friction while preserving control. |
| 2026-03-11 | Two-pass generation: Claude story JSON first, then Ideogram images sequentially | Clean separation of text and image generation. JSON schema validation before image spend. Sequential images avoids rate limits. |
| 2026-03-11 | Claude writes shared character description, appended to all 10 image prompts | Best available mechanism for visual consistency without Ideogram reference images. |
| 2026-03-11 | Fixed art style: watercolor and colored pencil, warm colors, soft edges, white background | Consistency matters more than choice in Phase 1. Style picker is Phase 2. |
| 2026-03-11 | Free tier counter triggers on Pass 1 completion (story text), not image delivery | Most defensible line. Generous to user. Failed images don't penalize. |
| 2026-03-11 | Free tier counter: anonymous UUID in localStorage, count stored in Supabase | No fingerprinting. COPPA safe. Motivated users can reset — acceptable for goodwill free tier. |
| 2026-03-11 | BYOK gate: modal after book 3 with Anthropic + Ideogram key fields | Both keys required. Non-punishing — dismissable, settings always accessible. |
| 2026-03-11 | No accounts in Phase 1 | Eliminates auth complexity. No PII collection. COPPA clean. Accounts are Phase 2. |
| 2026-03-11 | Phase 1 output: on-screen reader only, no PDF | PDF is Phase 2 upsell. Core mechanic proven by reader. |
| 2026-03-11 | Books accessible via UUID URL for 30 days, then purged | Enough utility for Phase 1 without building a library. Keeps Supabase Storage costs low. |
| 2026-03-11 | Target age range: 3-12, core marketing sweet spot 5-9 | Aligned to 5 Lexile tiers. 5-9 is peak picture book consumption age. |
| 2026-03-11 | Single generation event (no preview step) | Two-step flow adds friction and state machine complexity. Not worth it in Phase 1. |
| 2026-03-11 | BYOK requires both Anthropic and Ideogram keys | Both APIs are used. Cannot generate a complete book without both. |
| 2026-03-11 | BYOK UI: persistent settings drawer behind gear icon, top-right | Less disruptive than dedicated page. Works well on iPad. |
| 2026-03-12 | Product name: Inklings (CONFIRMED by Kevin) | Ink + lings (little ones) + inkling (hint of something magical). Warm, memorable, works at all age ranges. |
| 2026-03-11 | Reader layout: single-page, illustration left, text right, tap/swipe navigation | Mirrors physical picture book reading. Two-page spreads add layout complexity with no benefit. |
| 2026-03-11 | QA acceptance: all 10 pages have text + image, child's name in story, clear story arc | No automated Lexile validation in Phase 1. System prompt is the quality gate. |
| 2026-03-11 | Vercel Pro with maxDuration = 300 on all API routes | Full generation takes 60-120s. Pro tier eliminates timeout issues. No need for split client-driven architecture. |
| 2026-03-11 | Optional pet/sidekick field on creation form | Kids love animal companions. Makes stories more engaging. Optional to keep the form simple. |
| 2026-03-12 | Story model: Sonnet → Opus 4.6 | Better narratives, franchise energy, same $5/$25 pricing as Opus 4.5. Worth the upgrade. |
| 2026-03-12 | Reader layout: side-by-side → full-bleed with text overlay | Picture book standard. Image IS the page, text floats on a gradient strip. |
| 2026-03-12 | Story prompt: added page arc, franchise voice, catchphrases, cinematographic image prompts | Storytelling quality was generic. New prompt produces TV-quality story arcs. |
| 2026-03-12 | Character consistency: locked anchor (Chinese boy, red hoodie, blue sneakers) + art style injected on every image | Ideogram has no memory across pages. Hardcoded anchor + style string is the consistency cheat code. |
| 2026-03-12 | Reader dark theme | Full-bleed images need dark chrome, not white. |
| 2026-03-12 | Image engine: Ideogram → Replicate (fofr/consistent-character + FLUX Schnell) | Ideogram has no character consistency memory. fofr model uses FLUX + IP-Adapter, same architecture as Neolemon. 14× cheaper ($0.039 vs $0.58 per Segmind). Two-phase: anchor once per book, consistent-character per page. |
| 2026-03-12 | BYOK key swap: Ideogram API key → Replicate API token | Follows image engine swap. Token format: r8_... |
| 2026-03-12 | Tier specs corrected: previous specs benchmarked against parent read-alouds (Peter Rabbit). Actual early reader specs applied. | Previous "10-page, 8-12 words/page" was wrong for a 5-year-old. Corrected to actual F&P/DRA benchmarks. Page counts now scale by tier (12-32 pages). Validated against Landon (L1, ~14 pages, ~80 words) and Baylor (L2, ~20 pages, ~300 words). |
| 2026-03-12 | Page count: fixed 10 → variable by tier (12-32) | Correct page count is a core educational claim. 10 pages is a Tier 3-4 parent read-aloud format, not a Tier 2 early reader. |
