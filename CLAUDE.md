# Tuned For — Product Build System

You are building a product under the Tuned For umbrella. Before doing anything else, read these files in order:

1. `context/business.md` — Tuned For constants, philosophy, constraints
2. `context/product.md` — this product's definition, mechanics, target user
3. `context/stack.md` — technical stack, APIs, hosting, patterns

Once loaded, you know everything about this product. Every agent session starts here.

## Agent Roster

Specialized agents live in `.claude/agents/`. Activate by name:

- **product-architect** — validates spec, finds gaps, defines scope
- **frontend-developer** — Next.js, Tailwind, iPad-first UI
- **backend-architect** — API routes, Supabase, third-party integrations
- **rapid-prototyper** — fast working code, no polish, prove the concept
- **reality-checker** — evidence-based QA before any deploy

## Build Sequence

Run prompts in order from `/prompts/`:

```
01-define.md       → lock the spec
02-architect.md    → technical structure
03-core-ip.md      → the product's unique engine
04-ui-flows.md     → parent + user flows
05-build-tasks.md  → Claude Code executable task list
```

## Rules

- Never start coding before `01-define.md` is complete
- Never deploy before reality-checker signs off
- Keep `context/product.md` updated as decisions are made
- One product per repo — clone this template for each new product
