# Tuned For — Product Launch Template

A repeatable system for spinning up new products under the tunedfor.ai umbrella using Claude Code agents.

Clone this. Fill in the context. Run the prompts in order. Ship.

---

## How to Start a New Product

**Step 1 — Clone this template**
```bash
gh repo create tuned-for-[product-name] --template tuned-for/product-template
cd tuned-for-[product-name]
```

**Step 2 — Fill in the context files**

These three files are everything Claude Code will know about your product. Fill them out before running anything.

| File | What to fill in |
|------|----------------|
| `context/product.md` | Everything product-specific — fill out all sections |
| `context/business.md` | Already filled — only change if Tuned For constants change |
| `context/stack.md` | Already filled — add product-specific API integrations if needed |

**Step 3 — Install Claude Code agents**
```bash
# Agents are already in .claude/agents/ — Claude Code reads them automatically
# No installation needed
```

**Step 4 — Run the prompt sequence**

Open Claude Code. It reads `CLAUDE.md` automatically. Then work through the prompts:

```
prompts/01-define.md    → lock the spec (do this first, always)
prompts/02-architect.md → technical structure
prompts/03-core-ip.md   → build the unique engine
prompts/04-ui-flows.md  → build the UX
prompts/05-build-tasks.md → final task list + reality-checker handoff
```

Each prompt file contains the exact prompt to run and the criteria for "done."

---

## Agents

| Agent | When to use |
|-------|-------------|
| `product-architect` | Validating spec, resolving gaps, locking scope |
| `frontend-developer` | All UI — Next.js, Tailwind, iPad-first |
| `backend-architect` | API routes, Supabase, third-party integrations, BYOK |
| `rapid-prototyper` | Proving a concept works before building it properly |
| `reality-checker` | Final QA gate before every deploy |

Activate any agent by name in Claude Code:
```
"Activate the backend-architect agent and build the story generation route"
```

---

## Rules

1. Never start coding before `01-define.md` is complete
2. Never skip `03-core-ip.md` — if the core mechanic doesn't work, nothing else matters
3. Never deploy without a reality-checker PASS
4. Keep `context/product.md` updated as decisions are made — it's the living spec
5. One product per repo — clone this template for each new product

---

## Adding a New Product to tunedfor.ai

1. Clone this template
2. Fill `context/product.md`
3. Create subdomain: `[product].tunedfor.ai` in Vercel
4. Run the prompt sequence
5. Deploy

That's the whole system.

---

## What This Is Not

- This is not a CI/CD system
- This is not a team workflow — it's a solo operator system
- This is not a startup template — it's a passive play product template

The goal is: minimum setup, maximum output, ships when it's ready.
