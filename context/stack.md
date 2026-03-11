# Technical Stack

## Defaults (all Tuned For products unless product.md overrides)

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | Next.js 14 (App Router) | Existing pattern across all products |
| Styling | Tailwind CSS | Utility-first, no custom CSS unless necessary |
| Hosting | Vercel | Auto-deploy from main branch |
| Auth / usage | Supabase | Free tier for counters and basic user state |
| AI — text | Anthropic API (Claude Sonnet) | claude-sonnet-4-20250514 |
| AI — images | Ideogram API | One call per image, v3 preferred |
| PDF | pdf-lib | Existing dependency |
| Payments | Stripe | Only when paid tier is active |

## API Patterns

### Anthropic
```js
// Always use this model string
model: "claude-sonnet-4-20250514"

// BYOK pattern — key comes from client, never stored server-side
const apiKey = req.headers['x-anthropic-key'] ?? process.env.ANTHROPIC_API_KEY
```

### Ideogram
```js
// One call per page/image
// Pass style reference token for consistency across a session
// BYOK same pattern as Anthropic
```

### Supabase
```js
// Free book/use counter per user session
// No PII stored on free tier
// Account creation only if product explicitly requires it
```

## BYOK Rules

- Books 1–3 (or equivalent free tier): served on Tuned For keys
- Book 4+ (or equivalent): user enters their own Anthropic + Ideogram keys
- Keys stored in `localStorage` / browser session only
- Never sent to or stored on Tuned For servers
- UI must clearly state: "Your key stays on your device. We never see it."
- Simple error handling for invalid/expired keys

## File Structure (Next.js)

```
app/
  (parent)/         ← parent-facing flows
  (kid)/            ← child-facing flows (if applicable)
  api/
    generate/       ← AI generation endpoints
    score/          ← readability / scoring endpoints
components/
  ui/               ← shared UI primitives
  [feature]/        ← feature-specific components
context/            ← React context / state
lib/
  anthropic.ts      ← Claude API wrapper
  ideogram.ts       ← Ideogram API wrapper
  supabase.ts       ← Supabase client
  [product-core].ts ← Core product logic (the IP)
```

## Deployment

- Push to `main` → auto-deploys to Vercel
- Environment variables in Vercel dashboard (never in repo)
- `ANTHROPIC_API_KEY` and `IDEOGRAM_API_KEY` are Tuned For keys (free tier only)

## Performance Targets

- First load: < 3s on mobile
- iPad optimized first, desktop second
- Core Web Vitals: green before launch
