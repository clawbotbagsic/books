# Story Spark — Phase 1 Build Task List

> Document owner: product-architect
> Last updated: 2026-03-11
> Status: EXECUTION CHECKLIST — work from this document

---

## CURRENT STATE SUMMARY

The codebase is approximately 85% complete for Phase 1. All core files are built and structurally correct. What remains is a combination of infrastructure setup, one functional bug, one version spec violation, and deployment hardening.

**What is fully built and correct:**
- All API routes (`/api/generate`, `/api/book/[uuid]`, `/api/usage`) with correct logic
- Full BYOK key handling (headers, localStorage, env fallback)
- 3-layer free tier enforcement (SessionContext check, ByokModal gate, server-side 402)
- All lib files (lexile.ts, anthropic.ts, ideogram.ts, storage.ts, bookSchema.ts, supabase.ts)
- All component files per the architecture spec (16/16 components)
- All hooks (useByok, useSession, useBookGeneration)
- SessionContext with drawer/modal state management
- BookForm with tier nudge, theme suggestions, BYOK gate trigger
- ProgressScreen with polling, status messages, progress bar
- BookReader with swipe, keyboard, tap-zone navigation
- ShareBanner with clipboard fallback
- BookPage with image/text split layout
- Settings drawer and BYOK modal with correct copy

**What is missing or broken:**

1. No Supabase project exists yet — no tables, no storage bucket, no RLS policies. Every API route will throw on first call.
2. No environment variables configured anywhere (Vercel or local).
3. Ideogram model version is `V_2` in code; spec says `v3` preferred.
4. No OG image in `/public/`. Required for link previews (30-day shareable link is a core feature).
5. `context/BookContext.tsx` was planned in architecture but not built. Not blocking — SessionContext carries what's needed.
6. No Vercel project / custom domain configured.
7. `next build` has not been run to confirm zero TypeScript errors.

---

## 1. TASK LIST

### BLOCKING — Must be done before any user can generate a book

- [ ] [PRIORITY: HIGH] [AGENT: backend] Create Supabase project and run schema SQL
      Context: No books, usage, or cost_log tables exist. Every API call will fail immediately. This is the single hardest blocker.

- [ ] [PRIORITY: HIGH] [AGENT: backend] Create Supabase Storage bucket named "books" with public read / service-role write
      Context: `lib/storage.ts` uploads to a bucket called "books". If the bucket doesn't exist, all image uploads fail and every book stays in "generating" status forever.

- [ ] [PRIORITY: HIGH] [AGENT: backend] Apply Supabase RLS policies from architecture.md Section 3
      Context: Without RLS, the anon key would have write access to all tables. The service role key bypasses RLS for server-side writes as intended.

- [ ] [PRIORITY: HIGH] [AGENT: any] Configure environment variables for local development (.env.local)
      Context: Required vars: `ANTHROPIC_API_KEY`, `IDEOGRAM_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BASE_URL`. Without these, no API route can initialize.

- [ ] [PRIORITY: HIGH] [AGENT: any] Configure environment variables in Vercel dashboard
      Context: Same vars as above. Vercel auto-deploys from main but will fail at runtime without env vars. Must be done before any user-facing smoke test.

- [ ] [PRIORITY: HIGH] [AGENT: backend] Fix Ideogram model version: change `V_2` to `V_3` in lib/ideogram.ts
      Context: The spec explicitly says "Ideogram v3 preferred." `V_2` is hardcoded at line 55. One-line fix but materially affects output quality — v3 produces noticeably better children's book illustrations.

- [ ] [PRIORITY: HIGH] [AGENT: any] Run `next build` and fix any TypeScript compilation errors
      Context: The code has not been compiled. There may be type errors that would cause runtime failures, particularly around the Zod v4 API (package.json shows `zod@^4.3.6`, which has breaking changes from v3).

- [ ] [PRIORITY: HIGH] [AGENT: backend] Verify Zod v4 compatibility in bookSchema.ts and generate/route.ts
      Context: Zod v4 changes the `.flatten()` API to `.formErrors` and other breaking differences. `parsed.error.flatten()` at line 35 of generate/route.ts will throw at runtime if zod v4 is installed. Either pin zod to v3 (`"zod": "^3.23.0"`) or update all Zod calls to v4 syntax.

---

### LAUNCH — Should ship at launch; product is incomplete without these

- [ ] [PRIORITY: HIGH] [AGENT: frontend] Create OG image at `/public/og-image.png`
      Context: The 30-day shareable link is a core product mechanic. Without an OG image, shared links on iMessage, WhatsApp, and social show a blank preview — which kills the "save and share" moment that drives returns and word of mouth. Dimensions: 1200x630px. Content: Story Spark branding, amber color palette, tagline.

- [ ] [PRIORITY: HIGH] [AGENT: any] Smoke test the full happy path: form → generate → reader → share
      Context: No end-to-end test has been run. Supabase writes, image uploads, polling, and reader load must all work in sequence. Must be done before any real user touches it.

- [ ] [PRIORITY: HIGH] [AGENT: any] Smoke test the BYOK path: enter keys in Settings, generate book 4+
      Context: Confirms keys are passed as headers, server uses them, counter still increments. Must confirm no key appears in Supabase or server logs.

- [ ] [PRIORITY: HIGH] [AGENT: any] Smoke test the free tier gate: generate 3 books, confirm book 4 shows ByokModal
      Context: This is the monetization boundary. If the gate is broken (either too strict or too permissive), the product is either non-functional or giving away unlimited free generations.

- [ ] [PRIORITY: HIGH] [AGENT: any] Configure Vercel project and set custom domain: books.tunedfor.ai
      Context: Without the custom domain, the product isn't actually launched. This also requires the DNS record in whatever registrar manages tunedfor.ai.

- [ ] [PRIORITY: MED] [AGENT: frontend] Test iPad landscape layout in Safari on an actual iPad
      Context: The target device is explicitly iPad landscape. The BookPage component uses `md:` breakpoints for the illustration-left / text-right split. Must confirm this renders correctly in Safari WebKit, not just Chrome DevTools device emulation.

- [ ] [PRIORITY: MED] [AGENT: backend] Confirm `expires_at` generated column works in Supabase
      Context: The schema uses `GENERATED ALWAYS AS (created_at + INTERVAL '30 days') STORED`. However, `/api/generate/route.ts` manually inserts an `expires_at` value (line 132). If Supabase has the column as GENERATED, inserting it explicitly will throw. Resolve: either remove the manual `expires_at` insert from the route and rely on the generated column, or switch to a regular column with a default.

- [ ] [PRIORITY: MED] [AGENT: frontend] Verify the `next/image` component can load from the Supabase Storage domain
      Context: `next.config.mjs` has `*.supabase.co` in remotePatterns but the actual hostname format for Supabase Storage is `<project-ref>.supabase.co`. Confirm this wildcard matches in production by loading an actual stored image.

- [ ] [PRIORITY: MED] [AGENT: frontend] Confirm the progress screen navigation is wired correctly
      Context: `BookForm` navigates to `/generating?uuid=<uuid>` immediately after the POST to `/api/generate` resolves with a UUID. But `/api/generate` is a synchronous 60-120 second call — it does not return the UUID until the book is fully complete. The progress screen and polling logic exist but will never actually show incremental progress. The current flow works (user waits, then gets redirected), but the progress bar will sit at 5% for the entire generation time. This is a UX issue, not a blocking bug. The fix is out of scope for Phase 1 but should be documented.

- [ ] [PRIORITY: LOW] [AGENT: frontend] Add a `robots.txt` and basic `sitemap.xml`
      Context: Not critical for launch but prevents indexing issues. A simple `robots.txt` allowing all crawlers is sufficient.

---

### POST-LAUNCH — Can ship after first users

- [ ] [PRIORITY: MED] [AGENT: backend] Set up Supabase scheduled function or cron to purge expired books
      Context: The 30-day expiry is in the data model but nothing actually deletes rows or Storage objects after expiry. The `/api/book/[uuid]` route correctly returns 410 for expired books, but data accumulates in Supabase indefinitely. This doesn't affect users in Phase 1 but will become a cost issue at scale.

- [ ] [PRIORITY: MED] [AGENT: backend] Add monitoring for `/api/generate` failures
      Context: A failed book (Claude error or all images failed) leaves a "failed" or "stuck generating" record in Supabase. Kevin should be able to see failure rates without querying the DB manually. A simple Vercel log alert or Supabase dashboard query is sufficient.

- [ ] [PRIORITY: LOW] [AGENT: frontend] Consider addressing the progress screen UX issue (see LAUNCH task above)
      Context: The true fix is splitting `/api/generate` into two separate client-driven calls: POST to start story generation (fast, ~5s), then client polls for images. This is a meaningful refactor but would make the progress screen actually show live progress rather than a frozen bar.

- [ ] [PRIORITY: LOW] [AGENT: frontend] Add `BookContext.tsx` if state management becomes complex
      Context: Architecture doc specified this but it was not built. `SessionContext` is handling what's needed. Revisit if book-specific state (current page, generation state) needs to be shared across more components.

- [ ] [PRIORITY: LOW] [AGENT: any] Add error tracking (Sentry or similar)
      Context: Solo operator, passive project — console errors in Vercel logs are acceptable for now. Add Sentry if error volume justifies it.

---

## 2. REALITY-CHECKER HANDOFF CHECKLIST

These are the acceptance criteria from the Locked Phase 1 Spec, formatted for pass/fail verification.

### Core Mechanics

- [ ] PASS/FAIL: Form accepts child's name (max 30 chars), age (3-12), theme (max 100 chars), pronouns (he/him, she/her, they/them)
- [ ] PASS/FAIL: Age input auto-selects correct Lexile tier (3-4 → Tier 1, 5-6 → Tier 2, 7-8 → Tier 3, 9-10 → Tier 4, 11-12 → Tier 5)
- [ ] PASS/FAIL: Parent can nudge tier up or down one level. Nudge is clamped at 1 and 5 (no tier 0 or 6)
- [ ] PASS/FAIL: Tier selector displays tier name (e.g., "Developing Reader"), target age, and words-per-page spec
- [ ] PASS/FAIL: Tier selector nudge arrows are disabled (not hidden) at boundaries
- [ ] PASS/FAIL: Theme suggestions (pill chips) are clickable and populate the theme field
- [ ] PASS/FAIL: Form validation blocks submit on empty name or empty theme

### Generation

- [ ] PASS/FAIL: Clicking "Create My Book" triggers POST to `/api/generate`
- [ ] PASS/FAIL: Story JSON returned by Claude contains exactly 10 pages
- [ ] PASS/FAIL: Child's name appears in story text on all 10 pages (spot-check pages 1, 5, 10)
- [ ] PASS/FAIL: Pronouns match the selected option throughout the story
- [ ] PASS/FAIL: Story text per page matches the word/sentence count for the selected tier (manual spot-check for Tier 1 and Tier 3)
- [ ] PASS/FAIL: Character description field is present and non-empty in Claude's JSON response
- [ ] PASS/FAIL: All 10 Ideogram images are generated and stored in Supabase Storage
- [ ] PASS/FAIL: Image storage path follows pattern `books/<uuid>/page-<1-10>.jpg`
- [ ] PASS/FAIL: Book record is written to Supabase `books` table with status "complete" on success
- [ ] PASS/FAIL: Usage counter increments in `usage` table after Pass 1 success (not after image generation)
- [ ] PASS/FAIL: Failed image for one page does not abort the entire generation (other pages still generate)

### Progress Screen

- [ ] PASS/FAIL: Navigating to `/generating?uuid=<uuid>` shows the progress screen
- [ ] PASS/FAIL: Progress screen polls `/api/book/<uuid>` every 2 seconds
- [ ] PASS/FAIL: Status message shows "Writing your story..." when `pages_complete = 0`
- [ ] PASS/FAIL: Status message shows "Illustrating page N of 10..." as `pages_complete` increments
- [ ] PASS/FAIL: Progress bar advances as images complete
- [ ] PASS/FAIL: On book status "complete", client navigates automatically to `/book/<uuid>`
- [ ] PASS/FAIL: On book status "failed", progress screen shows error message with "Try Again" CTA to home
- [ ] PASS/FAIL: Navigating to `/generating` without a UUID shows "No book in progress" with link to home

### Reader

- [ ] PASS/FAIL: `/book/<uuid>` loads the completed book with all 10 pages
- [ ] PASS/FAIL: Reader displays illustration on the left half, story text on the right half (iPad landscape)
- [ ] PASS/FAIL: Left/right arrow buttons navigate between pages
- [ ] PASS/FAIL: Left arrow is hidden on page 1; right arrow is hidden on page 10
- [ ] PASS/FAIL: Swipe left navigates to next page; swipe right navigates to previous page
- [ ] PASS/FAIL: Arrow keys (left/right) navigate pages
- [ ] PASS/FAIL: Tapping left third of screen → previous page; tapping right third → next page
- [ ] PASS/FAIL: Page counter shows "Page N of 10" at bottom center
- [ ] PASS/FAIL: ShareBanner appears on the last page (page 10) showing the book URL and copy button
- [ ] PASS/FAIL: Copy button copies the URL to clipboard and shows "Copied!" confirmation
- [ ] PASS/FAIL: Reader title bar shows child's name and book theme
- [ ] PASS/FAIL: "Create new book" link in title bar navigates to home
- [ ] PASS/FAIL: Expired book (`expires_at` in the past) returns 410 and shows friendly expiry message with CTA
- [ ] PASS/FAIL: Missing UUID returns 404 and shows the global not-found page
- [ ] PASS/FAIL: Book still in "generating" status shows a waiting state with link back to progress screen

### BYOK and Free Tier Gate

- [ ] PASS/FAIL: First 3 book generations succeed without any API keys in localStorage
- [ ] PASS/FAIL: Attempting book 4 without BYOK keys shows `ByokModal` before any API call is made
- [ ] PASS/FAIL: `ByokModal` can be dismissed ("Maybe later") — user returns to form, nothing is blocked permanently
- [ ] PASS/FAIL: Entering keys in `ByokModal` and saving stores them in localStorage under `byok_anthropic_key` and `byok_ideogram_key`
- [ ] PASS/FAIL: After BYOK keys are saved, book 4 generates successfully using those keys
- [ ] PASS/FAIL: Server returns 402 if count >= 3 and no x-anthropic-key header is present (cannot bypass client gate by direct API call)
- [ ] PASS/FAIL: Gear icon is visible at top-right on all pages (home, progress, reader)
- [ ] PASS/FAIL: Clicking gear icon opens Settings drawer sliding in from right
- [ ] PASS/FAIL: Settings drawer shows Anthropic and Ideogram key fields with helper text "Your keys stay on your device"
- [ ] PASS/FAIL: Settings drawer shows "Get a free Anthropic key" and "Get a free Ideogram key" links that open in new tab
- [ ] PASS/FAIL: Saving keys in Settings closes the drawer and updates `hasKeys` state
- [ ] PASS/FAIL: Form shows remaining free book count (e.g., "2 free books remaining") when count < 3

### BYOK Security Checklist

- [ ] PASS/FAIL: `byok_anthropic_key` and `byok_ideogram_key` are NOT present in any Supabase table rows
- [ ] PASS/FAIL: `byok_anthropic_key` and `byok_ideogram_key` do NOT appear in Vercel function logs
- [ ] PASS/FAIL: API keys do NOT appear in any API response body (200, 400, 401, 422, or 500)
- [ ] PASS/FAIL: On invalid Anthropic key, error message names "Anthropic" and links to Settings (not a generic error)
- [ ] PASS/FAIL: On invalid Ideogram key, error message names "Ideogram" and links to Settings (not a generic error)
- [ ] PASS/FAIL: Free tier (no headers sent): server uses `process.env.ANTHROPIC_API_KEY` — confirm in Vercel function logs that no user key appears
- [ ] PASS/FAIL: BYOK tier: server uses header value — confirm `process.env.ANTHROPIC_API_KEY` is NOT used when header is present

### Infrastructure and Deployment

- [ ] PASS/FAIL: `next build` completes with 0 errors and 0 TypeScript errors
- [ ] PASS/FAIL: All required environment variables are set in Vercel dashboard
- [ ] PASS/FAIL: `books.tunedfor.ai` resolves and serves the application
- [ ] PASS/FAIL: HTTPS is active on the custom domain
- [ ] PASS/FAIL: Supabase `books` table exists with all columns from architecture spec
- [ ] PASS/FAIL: Supabase `usage` table exists with all columns from architecture spec
- [ ] PASS/FAIL: Supabase `cost_log` table exists with all columns from architecture spec
- [ ] PASS/FAIL: Supabase Storage bucket `books` exists with public read access
- [ ] PASS/FAIL: `/api/generate` has `export const maxDuration = 300` (Vercel Pro timeout)
- [ ] PASS/FAIL: `/api/book/[uuid]` has `export const maxDuration = 300`
- [ ] PASS/FAIL: OG image exists at `/public/og-image.png` and appears when the home URL is pasted into iMessage

### Performance

- [ ] PASS/FAIL: Home page loads in under 3 seconds on mobile (measured in Chrome DevTools, Slow 3G throttling)
- [ ] PASS/FAIL: Book reader page loads in under 3 seconds when book is complete (all images in Supabase Storage)
- [ ] PASS/FAIL: Core Web Vitals pass in PageSpeed Insights (green scores for LCP, FID, CLS)
- [ ] PASS/FAIL: No images are served directly from Ideogram CDN (all images are Supabase Storage URLs)

---

## 3. SESSION ESTIMATE

These are the BLOCKING tasks only, grouped by logical work unit:

| Session | Work | Estimated Duration |
|---------|------|-------------------|
| 1 | Supabase setup: create project, run schema SQL (books, usage, cost_log tables), create storage bucket, apply RLS policies, confirm connection from local dev | 45-60 min |
| 2 | Environment config: set .env.local, run `next dev`, verify no startup errors | 15-20 min |
| 3 | Zod v4 compatibility audit and fix: check every Zod call in generate/route.ts and bookSchema.ts, resolve API differences, run `next build` clean | 30-60 min |
| 4 | Fix Ideogram model string (V_2 → V_3), fix expires_at column conflict, run first end-to-end generation test | 20-30 min |
| 5 | Vercel deploy: configure project, set all env vars in dashboard, set books.tunedfor.ai domain, smoke test on production URL | 30-45 min |

**Total BLOCKING sessions: 5**
**Total estimated time: 2.5-4 hours**

The non-blocking LAUNCH tasks (OG image, iPad layout verification, full smoke test matrix) add another 1-2 hours and can run in parallel with Vercel deployment.

---

## 4. KNOWN ARCHITECTURAL ISSUE (NOT BLOCKING, DOCUMENT AND DEFER)

**Issue:** The progress screen does not show true live progress.

`/api/generate` is a single synchronous HTTP request that runs for 60-120 seconds and returns only when the book is fully complete. The progress screen is designed to poll `/api/book/<uuid>` to watch `pages_complete` increment. But because the route returns the UUID only after completion, the client cannot start polling until the book is already done.

The current behavior: user clicks "Create My Book," browser spins for 60-120 seconds on the POST, then receives the UUID, navigates to `/generating`, which immediately polls the book (already complete), and redirects to the reader. The progress screen shows for roughly 2 seconds.

**The spec calls for** a progress screen that shows "Writing your story... Illustrating page 1 of 10... Illustrating page 2 of 10..." as images complete. This requires a different architecture: POST only Pass 1 (fast, ~5s), receive UUID, navigate to progress screen, then poll as images are generated server-side (which would require a background job, SSE, or a separate client-triggered image generation call).

**Decision for Phase 1:** Accept the current behavior. The product delivers a complete book. The progress screen is not wrong — it just doesn't show true incremental progress. Document this for Phase 2.

**Note in Vercel config:** The 300s `maxDuration` is correctly set on all routes, so the 60-120s generation time will not timeout under normal conditions.
