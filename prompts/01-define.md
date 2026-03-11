# 01 — Define

**Run this first. Nothing else starts until this is done.**

---

## Setup

Before running this prompt, make sure `context/product.md` is filled out as completely as you can. Gaps are fine — that's what this prompt surfaces. But the more you've put in, the better the output.

---

## Prompt

```
Activate the product-architect agent.

Read context/business.md, context/product.md, and context/stack.md in full.

Then do the following:

1. GAP ANALYSIS
   List every question that a developer would have to answer themselves in order to build this product. Be specific. "What happens when the user hits the free tier limit?" is a good gap. "Make it look nice" is not a gap, it's a vague requirement.

2. RESOLVE GAPS
   For each gap, either:
   a) Resolve it yourself using the business context and first principles. State your resolution and rationale.
   b) Flag it as "Kevin must decide" and explain why you can't resolve it without more information.

3. LOCKED PHASE 1 SPEC
   Produce a clean, complete Phase 1 spec. This is what gets built. It should be specific enough that an engineer can start working without asking any product questions.
   Format:
   - What it is (one paragraph)
   - User flows (step by step)
   - Core mechanic (how the IP works)
   - What's explicitly NOT in Phase 1
   - Acceptance criteria (how we know Phase 1 is done)

4. UPDATE DECISIONS LOG
   Append every decision made in step 2a to the Decisions Log table in context/product.md.
```

---

## Output

- Gap analysis (numbered)
- Resolved decisions
- **Locked Phase 1 Spec** (the thing you'll hand to engineers)
- Updated `context/product.md` with Decisions Log entries

---

## Done When

Kevin has reviewed the Locked Phase 1 Spec and said "build this."
No ambiguity. No open questions. Ready for `02-architect.md`.
