# 02 — Architect

**Run after 01-define.md is complete and the spec is locked.**

---

## Setup

The Locked Phase 1 Spec from `01-define.md` is your input. If that spec isn't locked yet, stop and finish it first.

---

## Prompt

```
Activate the backend-architect agent.

Read context/product.md (specifically the Locked Phase 1 Spec), context/stack.md, and context/business.md.

Produce the full technical architecture for Phase 1. Include:

1. FILE STRUCTURE
   Show the complete Next.js file tree for this product. Every route, every component folder, every lib file. Don't show implementation — just the structure and a one-line description of each file's purpose.

2. DATA FLOW
   Diagram (in text/ascii) the data flow for the core mechanic. Input → processing steps → output. Include every API call with: which service, what goes in, what comes back.

3. SUPABASE SCHEMA
   Define every table needed for Phase 1. Columns, types, indexes. Write the SQL.

4. API ROUTES
   List every API route needed. For each:
   - Path
   - Method
   - What it receives
   - What it calls (Anthropic/Ideogram/Supabase)
   - What it returns
   - Estimated cost per call

5. BYOK TOUCHPOINTS
   Identify every point in the system where an API key is used. Confirm each follows the BYOK pattern from context/stack.md.

6. FREE TIER GATE
   Describe exactly how the free use counter works. Where it's incremented. Where it's checked. What happens when it hits the limit.

7. BUILD ORDER
   Give me the order to build things. What has to exist before what. Number them.
```

---

## Output

- File structure
- Data flow diagram
- Supabase schema SQL
- API route definitions
- BYOK touchpoint audit
- Free tier gate description
- Numbered build order

---

## Done When

The build order is clear and there are no architectural questions left. Ready for `03-core-ip.md`.
