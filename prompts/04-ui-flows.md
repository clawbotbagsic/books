# 04 — UI Flows

**Build the user-facing product. Core IP must be working before this.**

---

## Setup

- `03-core-ip.md` complete ✓
- `lib/[product-core].ts` exists and is tested ✓
- User flows defined in `context/product.md` ✓

---

## Prompt

```
Activate the frontend-developer agent.

Read context/product.md — specifically the User Flows section and Locked Phase 1 Spec.
Read context/stack.md for file structure and component standards.

Build all user-facing flows for Phase 1.

For each flow defined in context/product.md:

1. ROUTE STRUCTURE
   Create the page file(s) following Next.js App Router conventions.
   Follow the file structure from 02-architect.md exactly.

2. COMPONENT BUILD
   Build every component needed for this flow.
   - Full TypeScript types
   - Loading states on all async actions
   - Error states with user-friendly messages
   - iPad-first layout (768px minimum)
   - Accessible (aria labels, focus management)

3. API WIRING
   Connect each component to the correct API route from 02-architect.md.
   Do not implement API logic in components — call the routes.

4. FREE TIER GATE UI
   Implement the UI for when a user hits the free tier limit:
   - Clear, non-shaming message
   - BYOK explanation: "Your key stays on your device. We never see it."
   - Simple key input with validation feedback

5. FLOW REVIEW
   After building each flow, walk through it step by step and confirm:
   - Every step in context/product.md is implemented
   - Nothing requires the user to know what AI is
   - A non-technical parent/user could complete it without instructions
```

---

## Output

- All page files with full paths
- All component files with full paths
- BYOK UI component
- Free tier gate UI component

---

## Done When

Every user flow in `context/product.md` is implemented and a non-technical person could complete it. Ready for `05-build-tasks.md` or a reality-checker pass.
