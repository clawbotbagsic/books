# 05 — Build Tasks

**Run this to generate the final executable task list for Claude Code.**

This prompt produces a structured list of remaining tasks — everything that came out of prompts 01–04 that still needs implementation, cleanup, or wiring. It's the bridge between planning and pure execution.

---

## Setup

- All previous prompts complete ✓
- Core IP working ✓
- UI flows implemented ✓

---

## Prompt

```
Activate the product-architect agent.

Review everything that's been built:
- context/product.md (Locked Phase 1 Spec + Decisions Log)
- The file structure from 02-architect.md
- What was actually built in 03-core-ip.md and 04-ui-flows.md

Produce a complete, prioritized task list of everything remaining before Phase 1 is launch-ready.

Format each task as:
- [ ] [PRIORITY: HIGH/MED/LOW] [AGENT: frontend/backend/any] Task description
      Context: one sentence on why this matters or what it depends on

Group tasks into:
1. BLOCKING — must be done before launch
2. LAUNCH — should be done at launch but not blocking
3. POST-LAUNCH — can be done after users start using it

Then produce a final checklist to hand to reality-checker:
- Every acceptance criterion from the Locked Phase 1 Spec
- The full BYOK security checklist from the reality-checker agent
- The free tier gate confirmation

This task list is what gets executed. Make it specific enough that each task can be completed in a single Claude Code session without further clarification.
```

---

## Output

- Prioritized task list (BLOCKING / LAUNCH / POST-LAUNCH)
- Reality-checker handoff checklist
- Estimated sessions to completion (rough)

---

## Done When

Every BLOCKING task is complete and reality-checker has issued a PASS.
Then you deploy.
