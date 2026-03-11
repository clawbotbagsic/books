# Tuned For — Agent Roster

14 agents. Every phase of building and running a Tuned For product.
Place all `.md` files in `.claude/agents/` in any repo to activate.

---

## 🏗️ BUILD

| Agent | When to use |
|-------|-------------|
| `product-architect` | **Run first, always.** Validates the spec, finds gaps, produces the Locked Phase 1 Spec. Nothing gets built until this clears. |
| `backend-architect` | File structure, Supabase schema, API routes, BYOK patterns, build order. |
| `frontend-developer` | Next.js 14 App Router, Tailwind, iPad-first. Takes UI designer specs and builds them. |
| `rapid-prototyper` | Proves a concept works fast. Hardcodes everything. Never ships. |
| `reality-checker` | Final gate before deploy. Issues PASS or BLOCK. BYOK security is always a blocking issue. |

---

## 🎨 DESIGN

| Agent | When to use |
|-------|-------------|
| `ui-designer` | All UI decisions — tokens, components, layouts, flows. Produces Tailwind-ready specs the frontend-developer can build directly. Knows the Tuned For aesthetic cold. |

---

## 📚 PRODUCT (books.tunedfor.ai specific)

| Agent | When to use |
|-------|-------------|
| `education-professor` | The reading science expert. Produces prompt specs for each Lexile level. Reviews every story draft for vocabulary and sentence structure accuracy. Wins any dispute with the storyteller. |
| `storyteller` | Writes the actual book text from the professor's spec. Also produces Ideogram scene descriptions for each page. Always works from a prompt spec — never freestyle. |

---

## 📣 MARKETING

| Agent | When to use |
|-------|-------------|
| `growth` | Acquisition strategy. Organic only — no paid ads. Knows the BYOK model is the sharing trigger. Prioritizes parent communities, SEO, and ProductHunt. |
| `content-creator` | Writes everything external — blog posts, social, ProductHunt listings, landing page copy. Knows the Tuned For brand voice cold. Never sounds like a marketing department. |
| `seo` | Keyword strategy and SEO content for tunedfor.ai and product subdomains. Focused on long-tail parent searches ("what does mCLASS score mean"). |
| `reddit-community` | Authentic presence in r/Parenting, r/Teachers, r/FirstTimeParents. Knows Reddit culture. 90/10 rule — value first, product mention rarely. |

---

## ⚙️ OPERATIONS

| Agent | When to use |
|-------|-------------|
| `analytics` | Defines what to track, designs the Supabase schema (no PII), builds the weekly check-in metrics. Tracks BYOK conversion rate and cost per book. |
| `finance-tracker` | Monthly cost vs revenue tracking. API spend, unit economics, free tier budget. Revenue modeling when needed. Flags runaway costs before they become problems. |
| `legal-compliance` | COPPA, privacy policy, BYOK liability, LLC timing questions. Not a lawyer — frames the right questions for real counsel and flags issues early. |

---

## Workflow Order (for a new product)

```
1. product-architect    → lock the spec
2. ui-designer          → design system + key flows  
3. backend-architect    → file structure + schema + API routes
4. education-professor  → prompt specs (books only)
5. rapid-prototyper     → prove core IP works
6. storyteller          → generate story drafts (books only)
7. education-professor  → review drafts
8. frontend-developer   → build all UI flows
9. reality-checker      → pre-deploy gate
10. growth + seo        → launch plan
11. content-creator     → launch copy
12. reddit-community    → community presence
13. analytics           → tracking live
14. finance-tracker     → cost monitoring live
```
