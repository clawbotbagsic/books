# Story Generation Prompt Spec

**Source of truth for the Claude system prompt used in `lib/anthropic.ts`.**

When iterating on prompt quality: update this file first to document intent, then apply the change to `lib/anthropic.ts`. Both files should always be in sync.

---

## How the Prompt Is Built

`buildStoryPrompt(input, tier)` in `lib/anthropic.ts` returns a `{ systemPrompt, userPrompt }` pair. The system prompt carries all the rules and schema. The user prompt carries the per-request parameters.

---

## System Prompt

### Full Template

The system prompt is assembled at runtime with these interpolations:
- `${tier.name}` — e.g. "Developing"
- `${tier.lexileRange}` — e.g. "500-700L"
- `${tier.targetAge}` — e.g. "Ages 7-8"
- `${tier.wordsPerPage}` — e.g. "3-4 sentences, 10-15 words each"
- `${tier.sentenceRules}` — e.g. "Varied structure. Some descriptive language."
- `${tier.tier}` — numeric 1-5, used to select the tier-specific guidance block
- `${input.childName}` — the child's name, used in multiple places
- `${pronouns.subject}` / `${pronouns.object}` / `${pronouns.possessive}` — derived from `input.pronouns`

```
You are a master children's book author. Your specialty is writing personalized, illustrated picture books that are precisely calibrated to a child's reading development level using the Lexile Framework for Reading.

## YOUR TASK

Write a complete 10-page illustrated children's book. You will return ONLY valid JSON — no prose, no explanation, no markdown fences — matching the exact schema specified below.

## LEXILE TIER CONSTRAINTS (THIS IS THE MOST IMPORTANT RULE)

This story is written for the **${tier.name} Reader** tier (${tier.lexileRange}, ${tier.targetAge}).

**Word count per page:** ${tier.wordsPerPage}
**Sentence rules:** ${tier.sentenceRules}

You MUST enforce these constraints on EVERY page. Violating them will cause the story to be rejected.

Tier-specific guidance:
[ONE OF THE 5 BLOCKS BELOW, SELECTED BY tier.tier]

## CHARACTER DESCRIPTION (CRITICAL FOR VISUAL CONSISTENCY)

The JSON you return includes a `character_description` field. This is the single most important element for visual consistency across all 10 illustrations.

Write it as a precise, concrete visual description (3-5 sentences) covering:
- Hair: color, length, and style
- Skin tone
- Eyes: color
- Clothing: specific items and colors worn in the story
- Any unique distinguishing feature (glasses, freckles, a backpack, a favorite hat, etc.)

Do NOT use abstract traits ("looks friendly," "seems adventurous"). Only concrete visuals.
This description will be appended verbatim to every image generation prompt, so it must stand alone as a character brief.

## STORY REQUIREMENTS

- The main character's name is **${input.childName}**. Use this name in EVERY page of the story. Do not call the character "the child," "the kid," or any other substitute.
- Use the pronouns ${pronouns.subject}/${pronouns.object}/${pronouns.possessive} consistently throughout the story.
- The book theme/topic is: **${input.theme}**
- The story must have a clear beginning (pages 1-3), middle (pages 4-7), and end (pages 8-10).
- The story must be emotionally resonant — it should feel like a real children's book, not a writing exercise.
- Every page needs a meaningful moment that advances the story.
- The final page should have a satisfying, warm resolution appropriate for a bedtime story.

## IMAGE PROMPTS

Each page includes an `image_prompt` field. This is sent directly to an image generation model (Ideogram). Write it as a visual scene description, not prose:

- Describe the specific scene, setting, and action happening on that page
- Include emotion visible in the character's face/body language
- Describe background/environment details
- Do NOT include character physical description in image_prompt — it is appended automatically
- Keep each image_prompt to 2-4 sentences

## OUTPUT SCHEMA

Return ONLY this JSON structure. No markdown. No explanation. No code fences. Raw JSON only.

{
  "character_description": "string — concrete physical description of ${input.childName} for visual consistency",
  "pages": [
    {
      "page_number": 1,
      "text": "string — story text for this page, obeying tier word/sentence constraints",
      "image_prompt": "string — visual scene description for illustration"
    },
    ... (exactly 10 page objects, page_number 1 through 10)
  ]
}

REMINDER: Return ONLY valid JSON. Any prose before or after the JSON will cause a parse failure and the story will be rejected.
```

---

## Section Breakdown

### Identity + Task

```
You are a master children's book author...
```

Sets the model's role and frames the output as a real creative product, not a writing exercise. The "master author" framing correlates with higher quality output in testing.

The explicit JSON-only instruction appears here and is repeated at the end. Belt-and-suspenders: Claude sometimes adds a preamble sentence even when instructed not to. The `stripMarkdownFences()` call in `callClaude` handles the case where it wraps the JSON in code fences anyway.

### Lexile Tier Constraints

The most important section. Marked as such. The three fields (`tier.name`, `tier.lexileRange`, `tier.wordsPerPage`) appear first so they anchor everything that follows. The threat of rejection ("Violating them will cause the story to be rejected") is deliberate — it improves compliance.

### Tier-Specific Guidance Blocks

Each tier gets a dedicated block. Only the relevant tier's block is included in the prompt (the others collapse to empty string via the conditional template). Keeping unused tiers out of the prompt avoids confusion and reduces token count.

**Tier 1 — Emerging (Ages 3-4, 100-300L)**
- Explicit sight word list. Claude needs concrete vocabulary constraints, not abstract ones.
- Hard cap of 8 words per sentence.
- Onomatopoeia and repetition instruction — developmentally appropriate and what parents expect at this age.
- Example sentence provided.

**Tier 2 — Beginning (Ages 5-6, 300-500L)**
- Compound sentences allowed ("and"/"but" only).
- 12-word sentence cap.
- Introduces emotion vocabulary — a key developmental marker at this age.
- Example sentence provided.

**Tier 3 — Developing (Ages 7-8, 500-700L)**
- Simple + compound + short complex sentences.
- Specific vocabulary examples given (curious, discover, whispered, enormous) — concrete anchors work better than "grade-appropriate vocabulary" alone.
- Cause-and-effect structure instruction. This is what differentiates Tier 3 stories from Tier 2.
- Example sentence provided.

**Tier 4 — Fluent (Ages 9-10, 700-900L)**
- Subordinate clauses listed by connector word: when, because, although, while.
- Internal thought/emotion instruction — this is a major leap from Tier 3 and needs to be called out explicitly.
- Three-act structure requirement. At this level the reader can follow a full story arc.
- Example sentence uses `${input.childName}` to demonstrate name usage expectation.

**Tier 5 — Advanced (Ages 11-12, 900-1100L)**
- Literary devices listed explicitly: metaphor, simile, personification, foreshadowing.
- Full five-part story arc: inciting incident, complication, climax, resolution, reflection.
- Example sentence uses `${pronouns.subject}` and `${input.childName}` to demonstrate pronoun + name usage at this tier's complexity level.

### Character Description

The `character_description` field is the anchor for visual consistency across 10 Ideogram calls. Without a precise, stable description, illustrations drift — same character looks different on every page.

Key rules enforced by the prompt:
- 3-5 sentences (enough detail, not a novel)
- Concrete visuals only — no personality traits, mood, or abstract descriptors
- Covers the exact attributes that Ideogram responds well to: hair color/length/style, skin tone, eye color, clothing with specific colors, one distinguishing feature

The description is appended verbatim by `buildImagePrompt()` in `ideogram.ts`. Claude writes it once; it travels to every image call unchanged.

### Story Requirements

- Name enforcement is explicit ("EVERY page", with anti-patterns called out: "the child," "the kid"). Without this, Claude sometimes uses pronouns only for long stretches.
- Pronoun consistency reminder. Claude handles they/them correctly when reminded.
- Theme is passed as `${input.theme}` from the user's input, treated as a creative brief not a literal constraint.
- Three-act structure (beginning/middle/end) mapped to page ranges — this gives Claude structural scaffolding without prescribing content.
- "Not a writing exercise" — this phrase meaningfully increases the warmth and emotionality of output.
- Final page warm resolution — critical for the product's use case (bedtime stories).

### Image Prompts

The `image_prompt` per page is a scene brief, not a character brief. Character appearance is excluded here because it is appended automatically. This separation is intentional:
- Claude writes 10 different scene descriptions (varying action, setting, emotion)
- `buildImagePrompt()` prepends the art style prefix and appends the character description

The art style prefix (`ART_STYLE_PREFIX` in `ideogram.ts`):
```
children's book illustration, watercolor and colored pencil, warm colors, soft edges, white background
```

This is prepended to every image prompt before the character description and scene description. The `magic_prompt_option: 'OFF'` Ideogram setting is intentional — we do not want Ideogram rewriting the prompt, which would break character consistency.

### Output Schema

The schema is shown inline in the prompt with an example page object. This format (showing actual JSON with a `...` continuation) is more reliable than a prose description of the schema. The repeated "REMINDER" at the end catches cases where Claude processes schema instructions but then adds a closing sentence anyway.

---

## User Prompt

The user prompt is intentionally short. All rules live in the system prompt. The user prompt only carries the per-request parameters in a scannable list format.

```
Write a personalized children's book with the following details:

- **Child's name:** ${input.childName}
- **Child's age:** ${input.age} years old
- **Pronouns:** ${input.pronouns} (use ${pronouns.subject}/${pronouns.object}/${pronouns.possessive})
- **Book theme:** ${input.theme}
- **Reading level:** ${tier.name} Reader (${tier.lexileRange}) — STRICTLY enforce ${tier.wordsPerPage} per page

Make ${input.childName} the hero of the story. The story should feel personal, warm, and magical — the kind of book a child asks to hear again and again.

Return only the JSON.
```

The word count constraint is repeated inline in the user prompt ("STRICTLY enforce..."). This double-reinforcement (system + user) measurably improves tier compliance at the lower tiers (1 and 2), where Claude tends to over-write.

---

## Retry Logic

`generateStory()` makes one retry on any failure (JSON parse error, Zod validation failure, or network error). The retry uses the same prompts — no modification on retry. This catches transient failures and occasional Claude formatting lapses without over-engineering a retry loop.

If both attempts fail, a `StoryGenerationError` is thrown with the original cause attached. The API route is responsible for returning the appropriate HTTP error to the client.

---

## JSON Parsing

`stripMarkdownFences()` runs before `JSON.parse()` on every response. It removes leading ` ```json ` or ` ``` ` and trailing ` ``` ` wrappers. Claude ignores the "no code fences" instruction a small percentage of the time even with explicit instructions; this handles it cleanly without needing a more complex regex.

---

## Cost per Call

- One `claude-sonnet-4-20250514` call with `max_tokens: 4096`
- System prompt: ~1,200-1,400 tokens depending on tier (tier-specific block varies)
- User prompt: ~80-100 tokens
- Output: ~1,500-2,500 tokens for a complete 10-page story
- Approximate cost per generation: ~$0.02-0.04 at current Anthropic pricing

---

## Tuning Notes

If output quality needs improvement, check in this order:

1. **Tier compliance (wrong word count)**: Strengthen the per-tier example sentence. Add a second example. Make the sentence cap explicit in the tier block, not just in the global constraints.

2. **Character name drift (uses "the child" instead of name)**: The current prompt already calls this out directly. If it persists, add a per-page reminder in the schema example: `"text": "string — must include the name ${input.childName} on this page"`.

3. **Visual inconsistency across illustrations**: The character description is the lever. Make the prompt demand more specific attributes. Consider adding "Do not vary the character's appearance from page to page" to the image_prompt section.

4. **Image prompts are too generic**: Add to the image prompt section: "Each page's scene must be visually distinct from the others. Do not reuse the same setting or action twice."

5. **Story feels flat / not emotionally resonant**: The "not a writing exercise" phrase is already doing work. Try adding: "Write as if this book will be the child's favorite book for years."

6. **Tier 1 output is too long**: The sight word list and 8-word sentence cap are the main levers. If Claude still over-writes, add: "Count the words in each sentence before including it. If it exceeds 8 words, shorten it."
