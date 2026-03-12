# Product Context — Story Spark (books.tunedfor.ai)

> Last updated: 2026-03-11
> Status: LOCKED — Phase 1 Spec

---

## Identity

**Product name:** Story Spark
**Subdomain:** books.tunedfor.ai
**One-line description:** Generate a personalized, illustrated children's book in under 3 minutes.
**Tagline:** A personalized book, just for them.

---

## Problem & Solution

**The problem:**
Parents want to read personalized, meaningful books with their children, but generic store-bought books don't use the child's name, reflect their interests, or match their reading level. Custom children's books from services like Wonderbly are expensive ($30-50+), slow to ship, and static once printed.

**The solution:**
An AI-powered web app that generates a 10-page illustrated children's book tailored to the child's name, age, reading level, and chosen theme. Delivered instantly as an on-screen reader. First 3 books free.

**Why now / why us:**
Ideogram v3 and Claude Sonnet are capable enough to produce consistent, charming illustrations and age-appropriate prose. The cost per book is low enough to offer a real free tier. No competitor offers instant, personalized, reading-level-appropriate illustrated books at this quality and price point.

---

## Target User

**Primary user:**
- Who they are: Parents of children ages 3-12. Most likely 28-42 years old. Gift-giving mindset (bedtime, special occasions) or supplementing home reading.
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

Pass 1 — Story Generation (Claude Opus):
System prompt encodes the Lexile tier constraints (words per page, sentence complexity, vocabulary grade level) for the selected tier, the child's inputs, and a JSON output schema. Claude returns a 10-page story as structured JSON. Each page object contains: `page_number`, `text`, `image_prompt`. Claude writes a shared physical character description and appends it to every image prompt for visual consistency. JSON is validated; one retry on malformed output.

Pass 2 — Image Generation (Ideogram v3):
Each of the 10 image prompts is prefixed with the fixed style string: "Digital illustration, warm saturated colors, soft diffused lighting, children's picture book style, Studio Ghibli-inspired watercolor textures, slightly rounded character proportions, expressive faces, rich environmental detail, full scene composition." A hardcoded character anchor (Chinese boy, red hoodie, blue sneakers) and signature outfit are injected into every image prompt for visual consistency. Images generated sequentially (rate limit control). Aspect ratio: 4:3 landscape. Images stored in Supabase Storage tied to book UUID.

Completed book stored in Supabase as JSON record keyed to UUID. Accessible at books.tunedfor.ai/book/[uuid] for 30 days, then purged.

**Primary output:**
A 10-page illustrated children's book displayed in a single-page reader (iPad landscape). Shareable link valid for 30 days.

**Key parameters / variables:**

The 5 Lexile Tiers:

| Tier | Name | Lexile Range | Target Age | Words/Page | Sentence Structure |
|------|------|-------------|------------|------------|-------------------|
| 1 | Emerging | 100-300L | Ages 3-4 | 1-2 sentences, 5-8 words each | Simple declarative. Subject-verb-object only. |
| 2 | Beginning | 300-500L | Ages 5-6 | 2-3 sentences, 8-12 words each | Compound sentences ok. Common sight words. |
| 3 | Developing | 500-700L | Ages 7-8 | 3-4 sentences, 10-15 words each | Varied structure. Some descriptive language. |
| 4 | Fluent | 700-900L | Ages 9-10 | 4-5 sentences, 12-18 words each | Complex sentences. Richer vocabulary. |
| 5 | Advanced | 900-1100L | Ages 11-12 | 5-6 sentences, 15-20 words each | Subordinate clauses. Literary devices. |

Age-to-tier default mapping: Age 3-4 → Tier 1, Age 5-6 → Tier 2, Age 7-8 → Tier 3, Age 9-10 → Tier 4, Age 11-12 → Tier 5. Parent can nudge up or down one tier before generating.

Fixed art style: "children's book illustration, watercolor and colored pencil, warm colors, soft edges, white background" — prefixed to every Ideogram prompt.

---

## User Flows

**Flow 1 — Book Creation:**
1. Parent lands on books.tunedfor.ai. Hero CTA: "Create a Free Book."
2. Parent fills out 4-field form: child's name, age, theme/topic, pronouns.
3. System shows the auto-selected Lexile tier by name (e.g., "Developing Reader — Ages 7-8") with a short friendly description. Parent can nudge tier up or down one level.
4. Parent taps "Create My Book."
5. If book 4+ and no BYOK keys stored: BYOK modal appears before generation starts.
6. Progress screen with live status: "Writing your story... Illustrating page 1 of 10..." (updates as each image completes).
7. Reader loads automatically when generation is complete.
8. Reader: single-page view, illustration left, text right, tap/swipe to navigate, page counter at bottom center.
9. "Save this link" banner: 30-day URL + copy-to-clipboard button. Message: "Save this link — your book lives here for 30 days."

**Flow 2 — BYOK Setup:**
1. Parent taps gear icon (top-right, always visible).
2. Settings drawer slides in from the right.
3. Two fields: Anthropic API Key, Ideogram API Key.
4. Helper text: "Your key stays on your device. We never see it."
5. Links: "Get a free Anthropic key" and "Get a free Ideogram key" (open in new tab).
6. Parent saves. Keys stored in localStorage. Drawer closes.
7. On invalid key: next generation fails gracefully with a specific error message naming which key failed and linking back to Settings.

**Flow 3 — Returning to a Book:**
1. Parent opens a saved books.tunedfor.ai/book/[uuid] link.
2. Reader loads directly — no form, no gate.
3. If UUID is expired (30 days): friendly message "This book has expired. Create a new one!" with CTA back to the form.

---

## Monetization

**Free tier:** 3 books generated on Tuned For's Anthropic + Ideogram API keys. No account required. No credit card.

**Paid tier / BYOK trigger:** Book 4+ requires the parent to enter their own Anthropic and Ideogram API keys. Keys stored in localStorage only. Never sent to Tuned For servers.

**Free tier counter:** Anonymous UUID in localStorage. Counter stored in Supabase against that UUID. Counter increments when Pass 1 (story text) completes successfully. Increment is not triggered by image generation success/failure.

**BYOK gate UX:** After book 3 is delivered, the next "Create" attempt surfaces a modal: "You've used your 3 free books. Add your own API keys to keep creating." Non-punishing — user can dismiss and return. Settings drawer is always accessible via gear icon.

**Future upsells (Phase 2+):**
- Print-quality PDF download (one-time purchase per book, ~$1-3 via Stripe)
- Saved library (account feature)
- Physical book fulfillment (Phase 3, third-party print-on-demand)
- Art style selection (Phase 2)

---

## API Cost Model

| Component | Cost | Unit |
|-----------|------|------|
| Claude Opus — story generation | ~$0.003 | Per book (estimated ~1500 input tokens, ~800 output tokens) |
| Ideogram v3 — illustrations | ~$0.08-0.10 | Per image ($0.80-1.00 per 10-image book) |
| Supabase Storage — image hosting | ~$0.021 | Per GB (negligible per book at ~2MB per image = ~20MB/book) |
| Supabase DB — book record | Negligible | Free tier covers Phase 1 volume |

**Cost per free user (Tuned For keys):** ~$0.85-1.05 per book. 3 free books = ~$2.55-3.15 per user acquisition cost.
**Cost at BYOK threshold:** $0.00 to Tuned For — user pays their own API costs.
**Free tier economics:** Acceptable for a passive portfolio project. At 100 new users/month = ~$300/month in API costs. Reassess if volume spikes.

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
- Two-pass generation (Claude story JSON + Ideogram images)
- On-screen reader (single-page, iPad landscape)
- 30-day shareable link
- Free tier counter (3 books, anonymous UUID)
- BYOK settings drawer (Anthropic + Ideogram keys)
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

- RESOLVED: Product name is "Story Spark" — Kevin should confirm or override before UI copy is written.
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
| 2026-03-11 | Product name: Story Spark (PENDING KEVIN CONFIRMATION) | Warm, memorable, parent-facing. Not cloying. Works as a brand. |
| 2026-03-11 | Reader layout: single-page, illustration left, text right, tap/swipe navigation | Mirrors physical picture book reading. Two-page spreads add layout complexity with no benefit. |
| 2026-03-11 | QA acceptance: all 10 pages have text + image, child's name in story, clear story arc | No automated Lexile validation in Phase 1. System prompt is the quality gate. |
| 2026-03-11 | Vercel Pro with maxDuration = 300 on all API routes | Full generation takes 60-120s. Pro tier eliminates timeout issues. No need for split client-driven architecture. |
| 2026-03-11 | Optional pet/sidekick field on creation form | Kids love animal companions. Makes stories more engaging. Optional to keep the form simple. |
| 2026-03-12 | Story model: Sonnet → Opus | Richer narratives, better franchise energy, worth the cost increase. |
| 2026-03-12 | Reader layout: side-by-side → full-bleed with text overlay | Picture book standard. Image IS the page, text floats on a gradient strip. |
| 2026-03-12 | Story prompt: added page arc, franchise voice, catchphrases, cinematographic image prompts | Storytelling quality was generic. New prompt produces TV-quality story arcs. |
| 2026-03-12 | Character consistency: locked anchor (Chinese boy, red hoodie, blue sneakers) + art style injected on every image | Ideogram has no memory across pages. Hardcoded anchor + style string is the consistency cheat code. |
| 2026-03-12 | Reader dark theme | Full-bleed images need dark chrome, not white. |
