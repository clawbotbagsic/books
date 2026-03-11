# 03 — Core IP

**The most important prompt in the sequence. Build the product's unique engine first.**

This is the thing that makes the product work. For books.tunedfor.ai, it's the 5-tier story prompt system. For your product, it's whatever lives in the "Core Mechanics" section of `context/product.md`. Everything else is scaffolding around this.

---

## Setup

- `01-define.md` complete ✓
- `02-architect.md` complete ✓
- The Core Mechanic section of `context/product.md` is fully defined ✓

---

## Prompt

```
Activate the rapid-prototyper agent first.

Read context/product.md — specifically the Core Mechanics section and the Locked Phase 1 Spec.

STEP 1 — PROTOTYPE THE CORE MECHANIC
Build the minimum working version of the core IP. No UI. No database. Just the thing that takes an input and produces the correct output. Run it. Show me the output.

Then switch to the backend-architect agent.

STEP 2 — PRODUCTION IMPLEMENTATION
Take the prototype and build it properly:
- Full TypeScript types
- Proper error handling
- Logged to Supabase (delta between target and actual output, if applicable)
- Exported as a clean lib function: lib/[product-core].ts

STEP 3 — TEST CASES
Write 3 test inputs that cover:
- Minimum input (simplest possible case)
- Typical input (what most users will do)
- Edge case (something that could break it)

Run all three. Show output for each.

STEP 4 — PROMPT/CONFIG FILE
If the core mechanic involves an AI prompt (Anthropic, Ideogram, etc.), produce the complete prompt file as a standalone markdown file: prompts/[mechanic-name]-prompts.md
This file is the living spec for that prompt. It gets updated as the prompt improves.
```

---

## Output

- Prototype code (marked as prototype)
- Production lib file: `lib/[product-core].ts`
- Test case outputs (3 cases)
- Prompt spec file (if AI-powered)

---

## Done When

The core mechanic works end-to-end in production code, is tested, and is documented. Ready for `04-ui-flows.md`.

---

## Note

If the core mechanic doesn't work at this step — if the prototype reveals it's harder than expected, more expensive, or technically infeasible — **stop here**. Revise `context/product.md` before proceeding. This is the cheapest place to find that out.
