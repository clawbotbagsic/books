# Story Spark — Phase 1 Technical Architecture

> Document owner: backend-architect
> Last updated: 2026-03-11
> Status: APPROVED — Build from this document

---

## 1. FILE STRUCTURE

```
books/
├── app/
│   ├── layout.tsx                        # Root layout: fonts, metadata, global providers
│   ├── page.tsx                          # Home page: hero + 4-field creation form
│   ├── generating/
│   │   └── page.tsx                      # Progress screen: live status during generation
│   ├── book/
│   │   └── [uuid]/
│   │       └── page.tsx                  # Book reader: loads completed book by UUID
│   └── api/
│       ├── generate/
│       │   └── route.ts                  # POST: orchestrates full book generation (story + images)
│       ├── generate-story/
│       │   └── route.ts                  # POST: Pass 1 — calls Claude, returns story JSON
│       ├── generate-images/
│       │   └── route.ts                  # POST: Pass 2 — generates all 10 Ideogram images sequentially
│       ├── book/
│       │   └── [uuid]/
│       │       └── route.ts              # GET: fetches completed book record from Supabase
│       └── usage/
│           └── route.ts                  # GET/POST: checks and increments free use counter
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx                    # Shared button primitive
│   │   ├── Input.tsx                     # Shared input primitive
│   │   ├── Modal.tsx                     # Shared modal shell
│   │   └── Spinner.tsx                   # Loading spinner
│   ├── form/
│   │   ├── BookForm.tsx                  # 4-field creation form with tier display
│   │   ├── TierSelector.tsx              # Shows auto-selected tier; nudge up/down controls
│   │   └── ThemeSuggestions.tsx          # Pill chips: suggested themes (adventures, animals, etc.)
│   ├── progress/
│   │   ├── ProgressScreen.tsx            # Full-screen progress with status messages
│   │   └── ProgressStatus.tsx            # Individual status line: "Illustrating page 3 of 10..."
│   ├── reader/
│   │   ├── BookReader.tsx                # Root reader: page state, keyboard/swipe navigation
│   │   ├── BookPage.tsx                  # Single page: illustration left, text right
│   │   ├── PageCounter.tsx               # "Page 3 of 10" display at bottom center
│   │   └── ShareBanner.tsx               # "Save this link" banner with clipboard copy
│   ├── settings/
│   │   ├── SettingsDrawer.tsx            # Slide-in drawer from right: BYOK key entry
│   │   └── GearIcon.tsx                  # Top-right persistent gear button
│   └── byok/
│       └── ByokModal.tsx                 # "You've used your 3 free books" gate modal
│
├── context/
│   ├── SessionContext.tsx                # Anonymous session UUID, free use count, BYOK status
│   └── BookContext.tsx                   # In-flight book generation state, current page
│
├── lib/
│   ├── anthropic.ts                      # Claude API wrapper: buildStoryPrompt, callClaude, parseStoryJSON
│   ├── ideogram.ts                       # Ideogram API wrapper: buildImagePrompt, callIdeogram
│   ├── supabase.ts                       # Supabase client (server-side anon key)
│   ├── supabase-browser.ts               # Supabase client (client-side, for browser usage check)
│   ├── lexile.ts                         # Core IP: tier definitions, age-to-tier mapping, nudge logic
│   ├── bookSchema.ts                     # Zod schema: StoryJSON, Page, BookRecord types
│   └── storage.ts                        # Supabase Storage helpers: uploadImage, getImageUrl
│
├── hooks/
│   ├── useSession.ts                     # Reads/writes anonymous session UUID from localStorage
│   ├── useByok.ts                        # Reads/writes BYOK keys from localStorage
│   └── useBookGeneration.ts              # Drives SSE or polling for generation progress
│
├── types/
│   └── index.ts                          # Shared TypeScript types: BookForm, StoryJSON, Page, BookRecord
│
├── public/
│   └── og-image.png                      # OpenGraph image for link sharing
│
├── .env.local                            # ANTHROPIC_API_KEY, IDEOGRAM_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY
├── next.config.ts                        # Next.js config: image domains (Supabase Storage)
├── tailwind.config.ts                    # Tailwind config
└── package.json
```

---

## 2. DATA FLOW

### 2a. Book Creation — Happy Path (Free Tier)

```
Parent fills 4-field form
        |
        v
[Browser] reads localStorage
  - session_uuid: exists or generates new UUID
  - free_count: unknown (fetch from Supabase)
        |
        v
GET /api/usage?session=<uuid>
  - Supabase query: SELECT count FROM usage WHERE session_id = <uuid>
  - Returns: { count: 2, limit: 3, byok_required: false }
        |
        v
[Browser] count < 3 → proceed
  - BYOK keys NOT sent in headers (free tier uses env vars)
        |
        v
POST /api/generate
  Headers: (no x-anthropic-key, no x-ideogram-key)
  Body: { sessionId, childName, age, tier, theme, pronouns }
        |
        ├── PASS 1: Story Generation
        │     |
        │     v
        │   [lib/anthropic.ts] buildStoryPrompt()
        │     - Injects Lexile tier constraints (words/page, sentence rules)
        │     - Injects child name, theme, pronouns
        │     - Specifies JSON output schema
        │     |
        │     v
        │   Anthropic API — claude-sonnet-4-20250514
        │     IN:  system prompt (Lexile rules + schema) + user prompt (child inputs)
        │     OUT: JSON string — { character_description, pages: [{ page_number, text, image_prompt }] }
        │     COST: ~$0.003 (est. 1500 input tokens, 800 output tokens)
        │     |
        │     v
        │   [lib/bookSchema.ts] validateStoryJSON()
        │     - Zod parse: 10 pages, each has text + image_prompt
        │     - On failure: one retry with same prompt
        │     - On second failure: return 422 to client
        │     |
        │     v
        │   POST /api/usage — increment counter
        │     - Supabase upsert: usage table, session_id, count + 1
        │     - Counter triggers HERE (Pass 1 success) not after images
        │     |
        │     v
        │   book_uuid generated (crypto.randomUUID())
        │   Supabase INSERT: books table
        │     { uuid, session_id, child_name, tier, theme, story_json, status: 'generating' }
        │
        ├── PASS 2: Image Generation (10 sequential calls)
        │     |
        │     v
        │   FOR EACH page (1 → 10):
        │     [lib/ideogram.ts] buildImagePrompt()
        │       - Prefix: "children's book illustration, watercolor and colored pencil,
        │                   warm colors, soft edges, white background. "
        │       - Append: character_description
        │       - Append: page image_prompt from story JSON
        │     |
        │     v
        │     Ideogram API v3
        │       IN:  prompt string, aspect_ratio: "ASPECT_4_3"
        │       OUT: image URL (Ideogram CDN)
        │       COST: ~$0.08-0.10 per image
        │     |
        │     v
        │     [lib/storage.ts] uploadImage()
        │       - Fetch image from Ideogram URL
        │       - Upload to Supabase Storage: books/<uuid>/page-<n>.jpg
        │       - Returns: public Supabase URL
        │     |
        │     v
        │     Supabase UPDATE: books table
        │       - Append image URL to pages array at page index
        │       - status remains 'generating' until all 10 done
        │     |
        │     v
        │   [Client polling GET /api/book/<uuid>]
        │     - Returns current book state with pages_complete count
        │     - Progress screen updates: "Illustrating page N of 10..."
        │
        └── COMPLETION
              |
              v
            Supabase UPDATE: books table
              { status: 'complete', completed_at: now() }
              |
              v
            [Client] detects status: 'complete'
              → navigates to /book/<uuid>
              → BookReader loads, renders all 10 pages
              → ShareBanner displays 30-day URL
```

### 2b. Book Creation — BYOK Path (Book 4+)

```
POST /api/generate
  Headers: x-anthropic-key: <user key>, x-ideogram-key: <user key>
  (Tuned For env key NOT used)
  Body: same as free tier

All subsequent API calls use the user's keys.
Counter still increments in Supabase (for monitoring).
No cost to Tuned For.
```

### 2c. Book Read (Returning Visitor)

```
GET books.tunedfor.ai/book/<uuid>
        |
        v
[Server] page.tsx fetches GET /api/book/<uuid>
  - Supabase SELECT: books WHERE uuid = <uuid>
  - If not found or expired (completed_at < now() - 30 days): return 404
  - If found: return BookRecord
        |
        v
BookReader renders (no API calls, no key required)
```

---

## 3. SUPABASE SCHEMA

```sql
-- ============================================================
-- BOOKS TABLE
-- Stores each completed or in-progress book record.
-- ============================================================
CREATE TABLE books (
  uuid             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       TEXT NOT NULL,           -- anonymous UUID from localStorage
  child_name       TEXT NOT NULL,           -- used in story, not PII in legal sense
  tier             SMALLINT NOT NULL        -- 1-5 (Lexile tier)
                   CHECK (tier BETWEEN 1 AND 5),
  theme            TEXT NOT NULL,           -- free-text theme from parent
  pronouns         TEXT NOT NULL            -- 'he/him' | 'she/her' | 'they/them'
                   DEFAULT 'they/them',
  story_json       JSONB,                   -- full Claude output: { character_description, pages[] }
  image_urls       JSONB DEFAULT '[]'::jsonb, -- array of 10 Supabase Storage URLs, filled as generated
  pages_complete   SMALLINT DEFAULT 0,      -- 0-10, incremented as each image completes
  status           TEXT NOT NULL            -- 'generating' | 'complete' | 'failed'
                   DEFAULT 'generating',
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at     TIMESTAMPTZ,             -- set when status → 'complete'
  expires_at       TIMESTAMPTZ              -- created_at + 30 days, set on creation
                   GENERATED ALWAYS AS (created_at + INTERVAL '30 days') STORED
);

-- Index for UUID lookups (primary key covers this, but explicit for clarity)
-- Index for expiry purge job
CREATE INDEX idx_books_expires_at ON books (expires_at);
-- Index for session lookups (if we ever show "your books")
CREATE INDEX idx_books_session_id ON books (session_id);

-- ============================================================
-- USAGE TABLE
-- Tracks free book count per anonymous session.
-- ============================================================
CREATE TABLE usage (
  session_id       TEXT PRIMARY KEY,        -- anonymous UUID from localStorage
  count            SMALLINT DEFAULT 0 NOT NULL, -- number of books generated (Pass 1 completions)
  first_seen       TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_seen        TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- COST_LOG TABLE
-- Logs token usage and image generation calls for cost monitoring.
-- Not used in product UI — ops/monitoring only.
-- ============================================================
CREATE TABLE cost_log (
  id               BIGSERIAL PRIMARY KEY,
  book_uuid        UUID REFERENCES books(uuid) ON DELETE SET NULL,
  event_type       TEXT NOT NULL,           -- 'story_generation' | 'image_generation'
  input_tokens     INTEGER,                 -- Claude only
  output_tokens    INTEGER,                 -- Claude only
  image_count      SMALLINT,               -- Ideogram only
  used_byok        BOOLEAN DEFAULT false,   -- true if user's own keys were used
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_cost_log_book_uuid ON cost_log (book_uuid);
CREATE INDEX idx_cost_log_created_at ON cost_log (created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- All writes go through server-side API routes (service role key).
-- Client-side Supabase (anon key) is read-only for book status polling.
-- ============================================================
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_log ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read non-expired books (for reader page)
CREATE POLICY "Public can read active books"
  ON books FOR SELECT
  USING (expires_at > now() AND status = 'complete');

-- Allow anyone to read their own usage count (by session_id match)
-- Note: session_id is passed as a query param, not a JWT claim.
-- Usage reads go through the /api/usage route (server-side) for security.
-- No direct client RLS policy needed for usage table.

-- Service role key (server-side only) bypasses RLS for all writes.
```

---

## 4. API ROUTES

### Route 1: POST /api/generate

The core orchestration endpoint. Runs both passes and coordinates Supabase writes.

```
Path:    /api/generate
Method:  POST

Headers (BYOK path only):
  x-anthropic-key: <string>   -- user's Anthropic key; falls back to ANTHROPIC_API_KEY env
  x-ideogram-key:  <string>   -- user's Ideogram key; falls back to IDEOGRAM_API_KEY env

Request body:
  {
    sessionId:  string,         // anonymous UUID from localStorage
    childName:  string,         // 1-30 chars
    age:        number,         // 3-12
    tier:       number,         // 1-5 (client computes from age + nudge)
    theme:      string,         // 1-100 chars
    pronouns:   "he/him" | "she/her" | "they/them"
  }

Processing:
  1. Validate request body (Zod)
  2. Check usage count via Supabase — if count >= 3 AND no BYOK headers → 402 Payment Required
  3. Resolve API keys (header or env)
  4. Call Claude (Pass 1): buildStoryPrompt → Anthropic API → validateStoryJSON
  5. On valid JSON: INSERT book record (status: 'generating'), increment usage counter, log to cost_log
  6. Call Ideogram sequentially for each of 10 pages (Pass 2):
     - Build prompt, call Ideogram, fetch image, upload to Supabase Storage
     - UPDATE books.image_urls and pages_complete after each image
  7. UPDATE books status → 'complete', set completed_at
  8. Log image generation to cost_log

Response (success):
  HTTP 200
  {
    uuid:   string,             // book UUID for redirect to /book/<uuid>
    status: "complete"
  }

Response (errors):
  HTTP 400 — invalid request body
  HTTP 401 — no API key available
  HTTP 402 — free tier exhausted, no BYOK provided
  HTTP 422 — Claude returned invalid JSON twice
  HTTP 500 — Ideogram or Supabase failure with detail message

Estimated cost per call (Tuned For keys):
  Claude story: ~$0.003
  10x Ideogram images: ~$0.80-1.00
  Supabase Storage: ~$0.00042 (20MB @ $0.021/GB)
  Total: ~$0.85-1.00 per book
```

### Route 2: GET /api/book/[uuid]

Fetches a book record for the reader page or progress polling.

```
Path:    /api/book/[uuid]
Method:  GET

URL params:
  uuid: string  -- book UUID

Processing:
  1. Supabase SELECT: books WHERE uuid = <uuid>
  2. Check expires_at > now() — if expired, return 410
  3. Return full book record

Response (success):
  HTTP 200
  {
    uuid:           string,
    status:         "generating" | "complete" | "failed",
    pages_complete: number,       // 0-10 — client uses for progress display
    childName:      string,
    tier:           number,
    theme:          string,
    pages: [
      {
        page_number:  number,
        text:         string,
        image_url:    string | null   // null while image is still generating
      }
    ]
  }

Response (errors):
  HTTP 404 — UUID not found
  HTTP 410 — Book expired (>30 days)
  HTTP 500 — Supabase error

Estimated cost per call: $0.00 (Supabase read, free tier)
```

### Route 3: GET /api/usage

Checks the free use count for an anonymous session.

```
Path:    /api/usage
Method:  GET

Query params:
  session: string  -- anonymous UUID from localStorage

Processing:
  1. Supabase SELECT: usage WHERE session_id = <session>
  2. If no row: return count 0 (first-time user)
  3. Return count and limit

Response:
  HTTP 200
  {
    count:         number,   // 0, 1, 2, or 3+
    limit:         3,
    byok_required: boolean   // true if count >= 3
  }

Estimated cost per call: $0.00
```

### Route 4: POST /api/usage

Increments the free use counter. Called server-side from /api/generate after Pass 1 completes.

```
Path:    /api/usage
Method:  POST

Note: This route is called internally from /api/generate, not directly from the client.
      It uses the Supabase service role key (server-side only).

Request body:
  {
    sessionId: string
  }

Processing:
  1. Supabase UPSERT: usage table
     - If session_id exists: count = count + 1, last_seen = now()
     - If new: INSERT { session_id, count: 1, first_seen: now(), last_seen: now() }

Response:
  HTTP 200
  { count: number }

Estimated cost per call: $0.00
```

---

## 5. BYOK TOUCHPOINTS

Every point where an API key is consumed:

### Touchpoint 1: /api/generate — Anthropic key

```typescript
// lib/anthropic.ts
export function getAnthropicKey(req: Request): string {
  const key = req.headers.get('x-anthropic-key') ?? process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('No Anthropic API key available')
  return key
  // Key is used in this request only. Never written to disk, DB, or logs.
}
```

Free tier (books 1-3): header not sent by client. Falls back to `process.env.ANTHROPIC_API_KEY` (Tuned For key).
BYOK tier (book 4+): client sends `x-anthropic-key` header from localStorage value. Env var not used.

### Touchpoint 2: /api/generate — Ideogram key

```typescript
// lib/ideogram.ts
export function getIdeogramKey(req: Request): string {
  const key = req.headers.get('x-ideogram-key') ?? process.env.IDEOGRAM_API_KEY
  if (!key) throw new Error('No Ideogram API key available')
  return key
  // Key is used in this request only. Never written to disk, DB, or logs.
}
```

Same free/BYOK logic as Anthropic key above.

### Touchpoint 3: Client — localStorage read/write

```typescript
// hooks/useByok.ts
// Reads keys from localStorage. Never sends to server except as request headers.
// Never persisted anywhere other than the user's own browser localStorage.
export function useByok() {
  const getKeys = () => ({
    anthropicKey: localStorage.getItem('byok_anthropic_key') ?? '',
    ideogramKey:  localStorage.getItem('byok_ideogram_key') ?? '',
  })
  const saveKeys = (anthropicKey: string, ideogramKey: string) => {
    localStorage.setItem('byok_anthropic_key', anthropicKey)
    localStorage.setItem('byok_ideogram_key', ideogramKey)
  }
  return { getKeys, saveKeys }
}
```

### BYOK Compliance Checklist

| Rule | Implemented Where | Status |
|------|------------------|--------|
| Key from `x-anthropic-key` header or env fallback | `lib/anthropic.ts` getAnthropicKey() | Compliant |
| Key from `x-ideogram-key` header or env fallback | `lib/ideogram.ts` getIdeogramKey() | Compliant |
| Keys never stored server-side | No DB write of keys in any route | Compliant |
| Keys stored client-side in localStorage only | `hooks/useByok.ts` | Compliant |
| UI must state "Your key stays on your device" | `components/settings/SettingsDrawer.tsx` | Required |
| Invalid key error names which key failed | Error messages in /api/generate | Required |

---

## 6. FREE TIER GATE

### How the counter works

**What is counted:** Each successful Pass 1 (Claude story generation) completion. Image failures do not affect the count. Partial generations (Claude succeeded, all images failed) still count — the story text was generated at cost.

**The session UUID:** On first visit, the client generates a UUID via `crypto.randomUUID()` and stores it in `localStorage` as `session_uuid`. This UUID is sent with every API call as `sessionId` in the request body. It is never linked to any user identity, email, or device fingerprint.

**Counter flow:**

```
1. Client calls GET /api/usage?session=<uuid> on page load
   → Supabase reads usage table
   → Returns { count, limit: 3, byok_required }
   → SessionContext stores this state

2. Parent submits form → client checks SessionContext:
   - count < 3 AND BYOK keys not needed → proceed normally (no key headers sent)
   - count >= 3 AND BYOK keys present in localStorage → proceed (key headers sent)
   - count >= 3 AND BYOK keys missing → ByokModal appears BEFORE any API call

3. /api/generate receives request:
   - Server re-validates: if count >= 3 AND no x-anthropic-key header → 402
   - This is the server-side enforcement (client check is UX only)

4. After Pass 1 succeeds:
   - /api/generate calls POST /api/usage internally (server-side, service role key)
   - Supabase upserts: count + 1
   - If this was book 3, next form submission will show ByokModal

5. Next page load: GET /api/usage returns count: 3, byok_required: true
```

**Where the gate is checked:**

| Check Point | Type | Purpose |
|-------------|------|---------|
| Page load: GET /api/usage | Client | Pre-populate SessionContext so form can show gate immediately |
| Form submit: SessionContext check | Client | Show ByokModal before any API call (UX) |
| /api/generate request: server re-check | Server | Authoritative enforcement — client cannot bypass |

**What happens at the limit:**

- User submits form with count = 3 and no BYOK keys stored
- Client shows `ByokModal`: "You've used your 3 free books. Add your own API keys to keep creating."
- Modal has: two key entry fields (or links to Settings drawer), dismiss button, "Get a free Anthropic key" link
- If dismissed: user returns to form. Nothing is blocked permanently.
- If keys entered and saved: next submit sends key headers → generation proceeds → user's own API costs apply

**What cannot be easily bypassed:**

- Clearing localStorage resets the client-side session UUID
- Server also checks before generating — but without fingerprinting, a new UUID passes
- This is intentional: the free tier is goodwill, not a DRM system. Motivated users can reset it. Acceptable per product philosophy.

---

## 7. BUILD ORDER

Build in this sequence. Each step has a hard dependency on the ones before it.

```
STEP 1 — Environment foundation
  - Initialize Next.js 14 project (App Router)
  - Install dependencies: @anthropic-ai/sdk, @supabase/supabase-js, zod, tailwindcss
  - Configure .env.local: ANTHROPIC_API_KEY, IDEOGRAM_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
  - Configure next.config.ts: Supabase Storage image domain
  - Deploy blank app to Vercel, confirm env vars load

STEP 2 — Supabase schema
  - Create Supabase project
  - Run SQL: books table, usage table, cost_log table
  - Configure RLS policies
  - Create storage bucket: "books" (public read, service-role write)
  - Confirm supabase.ts and supabase-browser.ts clients connect

STEP 3 — Core IP: lib/lexile.ts
  - Define 5 tier objects (name, Lexile range, word counts, sentence rules)
  - Implement ageTierMap: age 3-12 → tier 1-5
  - Implement nudge logic: clamp to 1-5
  - Write unit tests inline (or in __tests__)
  - NO UI yet — this is pure logic, testable in isolation

STEP 4 — lib/bookSchema.ts and types/index.ts
  - Define Zod schema for StoryJSON (Claude output shape)
  - Define TypeScript types: BookForm, StoryPage, BookRecord
  - These types are imported by both API routes and UI components

STEP 5 — lib/anthropic.ts (Pass 1)
  - Implement buildStoryPrompt(): takes BookForm + tier object → system + user prompt strings
  - Implement callClaude(): takes apiKey + prompts → raw string response
  - Implement parseStoryJSON(): validates with Zod, throws on fail
  - Test with curl against /api/generate-story (next step) before wiring full orchestration

STEP 6 — /api/generate-story route
  - Wire buildStoryPrompt + callClaude + parseStoryJSON
  - BYOK key handling
  - Return validated StoryJSON on success, error on failure
  - One-retry logic for malformed Claude output

STEP 7 — lib/ideogram.ts (Pass 2)
  - Implement buildImagePrompt(): takes character_description + page image_prompt → full prompt string
  - Implement callIdeogram(): takes apiKey + prompt → image URL from Ideogram CDN
  - Test single image generation in isolation

STEP 8 — lib/storage.ts
  - Implement uploadImage(): fetches URL, uploads buffer to Supabase Storage, returns public URL
  - Test upload + public URL retrieval

STEP 9 — /api/usage routes (GET + POST)
  - GET: read usage count for session_id
  - POST: upsert increment
  - These are prerequisites for /api/generate enforcement

STEP 10 — /api/generate (full orchestration)
  - Wire Steps 5-9 into single route
  - Pass 1 → validate → increment counter → INSERT book record
  - Pass 2 loop: generate image → upload → UPDATE book record pages_complete
  - Final UPDATE: status → 'complete'
  - Full error handling at every step

STEP 11 — /api/book/[uuid] route
  - Fetch book by UUID
  - Expiry check
  - Return BookRecord shape

STEP 12 — SessionContext and hooks
  - useSession: generate/read localStorage session UUID
  - useByok: read/write BYOK keys from localStorage
  - SessionContext: wrap app with count, limit, byok status

STEP 13 — Home page form (app/page.tsx)
  - BookForm: 4 fields + validation
  - TierSelector: shows auto-selected tier, nudge controls
  - ThemeSuggestions: clickable chips
  - On submit: check SessionContext → show ByokModal if needed → POST /api/generate

STEP 14 — Progress screen (app/generating/page.tsx)
  - Receive book UUID from generate response
  - Poll GET /api/book/<uuid> every 2 seconds
  - Display "Writing your story..." then "Illustrating page N of 10..."
  - On status: 'complete' → navigate to /book/<uuid>

STEP 15 — Book reader (app/book/[uuid]/page.tsx)
  - Fetch complete BookRecord on load
  - BookReader: page state, swipe/keyboard navigation
  - BookPage: illustration left, text right (iPad landscape layout)
  - PageCounter, ShareBanner
  - 404/410 handling for missing/expired books

STEP 16 — Settings drawer + BYOK modal
  - GearIcon: always visible top-right
  - SettingsDrawer: slide-in, two key fields, helper text, links
  - ByokModal: gate modal triggered by SessionContext

STEP 17 — QA pass (reality-checker)
  - Generate 3 books on free tier → confirm counter gates book 4
  - Generate book 4 with BYOK keys
  - Test /book/<uuid> direct load
  - Test expired book 410 response
  - Test iPad landscape layout
  - Confirm no API keys appear in Supabase or logs
  - Confirm child name appears in all 10 pages of story
  - Confirm all 10 images render

STEP 18 — Deploy
  - Confirm Vercel env vars match .env.local
  - Set custom domain: books.tunedfor.ai
  - Smoke test on production URL
```

---

## 8. KEY DECISIONS AND NOTES FOR IMPLEMENTERS

### Hosting: Vercel Pro

This project uses **Vercel Pro**. All API routes set `export const maxDuration = 300` (5 minutes), which is sufficient for full book generation (60-120 seconds typical).

```typescript
// All API routes in app/api/*/route.ts
export const maxDuration = 300 // seconds — Vercel Pro
```

### Polling for progress

The progress screen polls GET /api/book/[uuid] every 2 seconds rather than using Server-Sent Events. /api/generate writes progress to Supabase as each image completes, and the client reads it independently. Simple, reliable, no SSE complexity.

### Image storage

Images from Ideogram are fetched server-side and re-uploaded to Supabase Storage. Ideogram CDN URLs are not stored directly because they may expire. Supabase Storage public URLs are permanent for the lifetime of the bucket object.

### Character consistency

Claude writes a single `character_description` block in the story JSON response. This block is appended to every Ideogram prompt. It is the only mechanism for visual consistency in Phase 1. Ideogram v3 does not support reference images in the same way as some other models. The system prompt instructs Claude to write this description in concrete visual terms (hair color, clothing, distinguishing features) rather than abstract traits.

### Supabase Storage bucket

Bucket name: `books`
Path pattern: `books/<uuid>/page-<1-10>.jpg`
Access: Public read (anonymous), service role write only
Image format: JPEG, downloaded from Ideogram CDN response URL

### Cost log

The `cost_log` table is write-only from the product's perspective. It exists for Kevin to monitor actual API spend. No product UI reads from it. The service role key is used for inserts (server-side only).

---

## 9. REQUEST/RESPONSE TYPES (REFERENCE)

```typescript
// types/index.ts

export interface BookFormInput {
  sessionId:  string
  childName:  string           // max 30 chars
  age:        number           // 3-12
  tier:       1 | 2 | 3 | 4 | 5
  theme:      string           // max 100 chars
  pronouns:   'he/him' | 'she/her' | 'they/them'
}

export interface LexileTier {
  tier:               1 | 2 | 3 | 4 | 5
  name:               string           // e.g. "Developing"
  lexileRange:        string           // e.g. "500-700L"
  targetAge:          string           // e.g. "Ages 7-8"
  wordsPerPage:       string           // e.g. "3-4 sentences, 10-15 words each"
  sentenceRules:      string           // e.g. "Varied structure. Some descriptive language."
}

export interface StoryPage {
  page_number:   number        // 1-10
  text:          string        // story text for this page
  image_prompt:  string        // raw image prompt from Claude (character description appended separately)
}

export interface StoryJSON {
  character_description:  string    // shared visual description appended to all image prompts
  pages:                  StoryPage[]  // exactly 10 items
}

export interface BookRecord {
  uuid:            string
  status:          'generating' | 'complete' | 'failed'
  pages_complete:  number          // 0-10
  childName:       string
  tier:            number
  theme:           string
  pages: {
    page_number:  number
    text:         string
    image_url:    string | null    // null until that page's image is uploaded
  }[]
  createdAt:       string          // ISO 8601
  expiresAt:       string          // ISO 8601 — createdAt + 30 days
}

export interface UsageResponse {
  count:          number
  limit:          3
  byok_required:  boolean
}
```

---

*Architecture document complete. Frontend-developer and rapid-prototyper should build from this document. Reality-checker should validate against this document before any deploy.*
