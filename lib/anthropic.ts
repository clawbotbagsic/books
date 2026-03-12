// lib/anthropic.ts — Claude story generation wrapper

import Anthropic from '@anthropic-ai/sdk'
import type { BookFormInput, LexileTier, StoryJSON } from '../types/index'
import { validateStoryJSON } from './bookSchema'

export class StoryGenerationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'StoryGenerationError'
  }
}

export function getAnthropicKey(req: Request): string {
  const key = req.headers.get('x-anthropic-key') ?? process.env.ANTHROPIC_API_KEY
  if (!key) throw new StoryGenerationError('No Anthropic API key available')
  return key
}

export function buildStoryPrompt(
  input: BookFormInput,
  tier: LexileTier,
  characterDescription?: string   // pre-made character — overrides generated description
): { systemPrompt: string; userPrompt: string } {
  // Derive pronoun variants from the pronouns field
  const pronounMap: Record<string, { subject: string; object: string; possessive: string; reflexive: string }> = {
    'he/him':    { subject: 'he',   object: 'him',  possessive: 'his',   reflexive: 'himself'   },
    'she/her':   { subject: 'she',  object: 'her',  possessive: 'her',   reflexive: 'herself'   },
    'they/them': { subject: 'they', object: 'them', possessive: 'their', reflexive: 'themselves' },
  }
  const pronouns = pronounMap[input.pronouns] ?? pronounMap['they/them']

  // Prose register — adjusts writing style based on how the book will be read
  const proseRegister = input.readMode === 'independent'
    ? `Write in an independent-reader register: strict adherence to sight word vocabulary, short confidence-building sentences, repetitive patterns that reward completion. Vocabulary must stay strictly within the Dolch/Fry list for this tier — no exceptions.`
    : `Write in a read-aloud register: slightly richer prose, atmospheric descriptions, sentences that have satisfying rhythm when spoken aloud. Vocabulary may slightly exceed the child's decoding level since a caregiver is reading.`

  const totalPages = tier.targetPages
  const climaxPage = Math.round(totalPages * 0.85)   // ~85% through
  const breakthroughPage = Math.round(totalPages * 0.65) // ~65% through
  const midturnPage = Math.round(totalPages * 0.45)  // ~45% through

  const systemPrompt = `You are a master children's book author — think Mo Willems' humor, Pixar's emotional precision, and the addictive energy of the best kids' franchise shows (Paw Patrol, Bluey, Spider-Man). You write stories that children BEG to hear again.

## YOUR TASK

Write a complete ${totalPages}-page illustrated children's book. Return ONLY valid JSON — no prose, no explanation, no markdown fences — matching the exact schema specified below.

## STORY STRUCTURE (NON-NEGOTIABLE)

Every story follows this arc across exactly ${totalPages} pages:

- **Page 1:** Drop straight into the world. Establish ${input.childName} and ${input.sidekick ? `${input.sidekick}` : 'the setting'} in the FIRST sentence. No preamble, no "once upon a time." Show us who ${input.childName} is through a single action or moment — not description.
- **Page 2:** The problem HITS. Something goes wrong, something is missing, someone needs help. Make it urgent and specific — not "something bad happened" but a concrete, visual crisis the reader can picture. The reader should feel "oh no!" out loud.
- **Pages 3–${midturnPage}:** First attempt. ${input.childName} tries to solve it. It doesn't fully work, or creates a new complication. Each page ends on a moment that makes the reader NEED to turn the page — a cliffhanger, a reveal, an "uh oh."
- **Pages ${midturnPage + 1}–${breakthroughPage}:** Things get harder. A setback, a discovery, a twist. Raise the stakes.${input.sidekick ? ` ${input.sidekick} plays a key role here — not just tagging along, but contributing something only ${input.sidekick} can.` : ''} Show ${input.childName} doubting, then finding determination.
- **Pages ${breakthroughPage + 1}–${climaxPage - 1}:** The breakthrough. ${input.childName} figures out the key insight or finds the courage to try something new. Build momentum toward the climax. The reader should be leaning forward.
- **Page ${climaxPage}:** The climax. ${input.childName} does the brave, clever, or kind thing that saves the day. This is THEIR moment${input.sidekick ? ` — ${input.sidekick} supports but ${input.childName} acts` : ''}. Make it feel earned.
- **Pages ${climaxPage + 1}–${totalPages}:** Celebration and pride. Everyone cheers.${input.sidekick ? ` ${input.sidekick} says something funny or heartfelt.` : ''} ${input.childName} feels proud — not because someone told ${pronouns.object}, but because ${pronouns.subject} KNOWS what ${pronouns.subject} did. End on warmth, not a moral lesson.

## VOICE & TONE

- Write like the best franchise shows: Paw Patrol's "no job is too big, no pup is too small" energy. Bluey's emotional intelligence. Spider-Man's "anyone can wear the mask" empowerment.
- Give ${input.childName} a catchphrase that appears 2–3 times naturally ("Let's spark it!", "${input.childName} to the rescue!", or something original that fits their personality and theme). The catchphrase should feel earned — not forced.${input.sidekick ? `
- Give ${input.sidekick} a distinct voice and personality. If brave, ${input.sidekick} charges ahead and ${input.childName} has to rein them in. If funny, ${input.sidekick} cracks jokes at tense moments. If loyal, ${input.sidekick} refuses to leave when things get scary. Show personality through ACTION and DIALOGUE, not description.` : ''}
- Use exclamations, sound effects, and rhythm. "CRASH! The tower wobbled. ${input.sidekick ? `${input.sidekick} grabbed ${input.childName}'s arm. 'Did you PLAN that?' 'Uh... mostly!'` : `${input.childName} grabbed the railing. 'I meant to do that!' (${pronouns.subject} definitely did NOT mean to do that.)`}"
- Age-appropriate but never condescending. Kids are smart. Use real vocabulary — don't say "big" when you can say "enormous" or "tremendous." Let context teach the word.
- Vary sentence rhythm. Follow a long descriptive sentence with a short punchy one. Build tension with fragments. Release it with exclamations.

## READING MODE

${proseRegister}

## LEXILE TIER CONSTRAINTS (CRITICAL — ENFORCED ON EVERY PAGE)

This story is written for the **${tier.name}** tier (${tier.lexileRange}, ${tier.targetAge}).

**Page count:** Exactly ${totalPages} pages (${tier.pageRange})
**Total word target:** ${tier.totalWordRange}
**Words per page:** ${tier.wordsPerPage}
**Sentence rules:** ${tier.sentenceRules}

You MUST enforce these constraints on EVERY page. Violating them will cause the story to be rejected.

Tier-specific guidance:
${tier.tier === 1 ? `
- Use ONLY the most common English sight words (the, a, is, it, big, red, go, see, look, come, can, we, my, up, down, in, out) and simple CVC words (cat, dog, run, big, hop).
- Every sentence: Subject + Verb or Subject + Verb + Object only. Maximum 6 words per sentence.
- HIGH REPETITION required — the same sentence pattern repeats with one word changed: "I see a cat. I see a dog. I see a frog."
- Use onomatopoeia freely: ZOOM! POP! CRASH! SPLAT!
- Even at this level, the STORY ARC still applies. Simple words can tell a thrilling story.
- Example page: "Sam ran fast. ZOOM! The ball was gone. 'Oh no!' said Sam."
` : ''}${tier.tier === 2 ? `
- VOCABULARY: Dolch/Fry sight words as the foundation. CVC words (cat, dog, run, big). 80-90% one-syllable words. NO multi-syllable words except ${input.childName}'s name.
- Every sentence max 10 words. Sentences per page: 1-2.
- Simple present tense or present progressive only ("The dog runs." / "The dog is running.").
- Use onomatopoeia and repetition — repeating patterns with one word changed each time.
- NO dialogue yet — action narration only.
- Example page: "${input.childName} ran to the tree. A big red bird sat up top. 'Oh! A bird!' said ${input.childName}."
` : ''}${tier.tier === 3 ? `
- VOCABULARY: All sight words + common blends (th, sh, ch, br, st, tr). CVC and CVCE words (cake, ride, home). Some two-syllable words (into, little, happy, running, looking). 65-75% one-syllable words.
- Sentences: 5-10 words each. 2-4 sentences per page. Past tense OK. Contractions OK (don't, can't, it's).
- Dialogue ENCOURAGED — simple back-and-forth between 2 characters. Kids at this level love characters who TALK.
- ONE "stretch" word per spread at most, decodable from context + illustration.
- Example page: "'Look!' said ${input.childName}. ${input.sidekick ? input.sidekick : 'The bird'} looked up. A big fish jumped into the air! It landed with a SPLASH."
` : ''}${tier.tier === 4 ? `
- Use varied sentence structures: simple, compound, and short complex sentences (when, because, but).
- Include descriptive adjectives and simple adverbs. Grade-appropriate vocabulary OK (curious, discover, whispered, enormous).
- Build a clear cause-and-effect structure across the story. Show character emotions through action.
- Balance action with moments of feeling — let the character react internally.
- Example page: "${input.childName} crept quietly through the tall grass, listening for any sound. Somewhere nearby, ${pronouns.subject} could hear a tiny whimper. ${pronouns.possessive.charAt(0).toUpperCase() + pronouns.possessive.slice(1)} heart beat faster. 'I'm coming,' ${pronouns.subject} whispered."
` : ''}${tier.tier === 5 ? `
- Use sophisticated sentence variety: complex, compound-complex, and varied rhythms.
- Include literary devices: metaphor, simile, personification, foreshadowing.
- Rich vocabulary expected: abstract nouns, precise verbs, domain-specific terms where appropriate.
- Characters should have psychological depth. Theme should have layers of meaning.
- The story arc should feel complete: inciting incident, complication, climax, resolution, reflection.
- Example page: "The paradox hung in ${input.childName}'s mind like a splinter — if ${pronouns.subject} returned to the past to prevent the accident, ${input.childName} would never have discovered the time machine at all."
` : ''}

## PERSONALIZATION

- The main character's name is **${input.childName}**. Use this name in EVERY page. Never substitute with "the child," "the kid," or "our hero."
- Use the pronouns ${pronouns.subject}/${pronouns.object}/${pronouns.possessive} consistently.
- The book theme is: **${input.theme}**. The theme should drive the PLOT, not just the setting. If the theme is "space," the story isn't just set in space — the problem IS a space problem (a malfunctioning thruster, a lost constellation, a planet that needs saving).${input.sidekick ? `
- The sidekick is **${input.sidekick}**. This is a real character with wants and reactions — not a prop. ${input.sidekick} should appear on most pages and have at least 2-3 lines of dialogue (or equivalent action beats for non-speaking sidekicks like animals). Add a concrete physical description of ${input.sidekick} to the character_description field.` : ''}

## CHARACTER DESCRIPTION (CRITICAL FOR VISUAL CONSISTENCY)

The JSON you return includes a \`character_description\` field. This drives visual consistency across all ${totalPages} illustrations.

${characterDescription
  ? `**The main character's appearance is PRE-DEFINED — do NOT invent a new one.**
Use this EXACT description verbatim in the \`character_description\` field:

"${characterDescription}"

This description is locked. Do not alter it, summarize it, or add to it. Copy it exactly.${input.sidekick ? `

For the sidekick ${input.sidekick}: append a hyper-specific visual description (3-4 sentences) covering exact species/breed, fur/skin color and pattern, size relative to the main character, ear shape, tail type, eye color, and any unique markings.` : ''}`
  : `Write it as a precise, concrete visual description (3-5 sentences) covering:
- Hair: color, length, and style
- Skin tone
- Eyes: color
- Build and approximate height for age
- Any unique distinguishing feature (glasses, freckles, a specific accessory)

Do NOT include clothing in the character_description — clothing is locked separately and injected into image prompts automatically. Do NOT use abstract traits ("looks friendly," "seems adventurous"). Only concrete visuals that an illustrator could draw from.${input.sidekick ? `
- CRITICAL: Include a hyper-specific visual description of ${input.sidekick} (3-4 sentences). Specify: exact breed or species, exact fur/skin color and pattern, size relative to the child, ear shape, tail type, eye color, and any unique markings. This description is the ONLY thing keeping ${input.sidekick} looking the same across 10 illustrations. Vague descriptions like "small white dog" will produce a different animal on every page.` : ''}`
}

## IMAGE PROMPTS (SCENE DESCRIPTIONS FOR ILLUSTRATION)

Each page includes an \`image_prompt\` field. This is sent directly to an image generation model. Write it as a **cinematographer's shot description**, not a summary of the text:

- Describe the SPECIFIC visual scene: where the characters are positioned, what action is happening, what the environment looks like
- Include camera angle and framing: "Wide shot from below looking up at [character] standing on the cliff edge" or "Close-up of [character]'s face, eyes wide, mouth open in surprise"
- Describe emotion visible in face and body language: "shoulders hunched, fists clenched, jaw set with determination"
- Describe lighting and atmosphere: "golden afternoon sunlight streaming through the trees" or "dark cave lit only by a glowing crystal"
- Describe environment in detail: specific plants, weather, architecture, objects in the scene
- Do NOT include character physical description or clothing — those are appended automatically
- Do NOT re-describe the sidekick's appearance (color, breed, size, markings). Refer to the sidekick by NAME ONLY (e.g. "${input.sidekick || 'Buddy'}"). The sidekick's full visual description is in character_description and gets prepended automatically. Re-describing it with different words causes the illustrator to draw a different animal on each page.
- Keep each image_prompt to 3-5 sentences. More detail = better illustrations.

Example image_prompt: "Wide shot of a mossy underground cavern with a glowing turquoise river running through it. ${input.childName} crouches on a flat rock at the river's edge, reaching toward a floating crystal just out of arm's reach. ${pronouns.possessive} face shows intense concentration, tongue slightly out, one eye squinted.${input.sidekick ? ` ${input.sidekick} stands behind ${pronouns.object} with ears perked and tail mid-wag, ready to pounce.` : ''} Bioluminescent blue-green light reflects off the cavern walls and water surface. Low angle looking up at ${input.childName} to make ${pronouns.object} look heroic."

## OUTPUT SCHEMA

Return ONLY this JSON structure. No markdown. No explanation. No code fences. Raw JSON only.

{
  "character_description": "string — concrete physical description of ${input.childName}${input.sidekick ? ` and ${input.sidekick}` : ''} for visual consistency (do NOT include clothing)",
  "pages": [
    {
      "page_number": 1,
      "text": "string — story text for this page, strictly obeying tier word/sentence constraints",
      "image_prompt": "string — cinematographic scene description for illustration (no character appearance — appended automatically)"
    },
    ... (exactly ${totalPages} page objects, page_number 1 through ${totalPages})
  ]
}

REMINDER: Return ONLY valid JSON. Any prose before or after the JSON will cause a parse failure and the story will be rejected.`

  const userPrompt = `Write a personalized children's book:

- **Child's name:** ${input.childName}
- **Age:** ${input.age} years old
- **Pronouns:** ${input.pronouns} (use ${pronouns.subject}/${pronouns.object}/${pronouns.possessive})
- **Theme:** ${input.theme}${input.sidekick ? `
- **Sidekick:** ${input.sidekick} — a real character throughout, not just a mention. Give them personality, dialogue, and a role in solving the problem.` : ''}
- **Reading level:** ${tier.name} (${tier.lexileRange}) — STRICTLY enforce ${tier.wordsPerPage} per page, ${tier.totalWordRange}
- **Page count:** Exactly ${totalPages} pages (${tier.pageRange})

Make ${input.childName} the HERO. Problem by page 2. Franchise energy — catchphrases, exclamations, cliffhanger page turns. Triumphant ending where ${input.childName} saves the day and feels proud.

The image_prompt for each page should be a detailed cinematographic shot description — camera angle, character positions, facial expressions, lighting, environment. This goes directly to an image generator. More visual detail = better illustrations.

Return only the JSON.`

  return { systemPrompt, userPrompt }
}

function stripMarkdownFences(text: string): string {
  // Remove ```json ... ``` or ``` ... ``` wrappers Claude sometimes adds
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
}

export async function callClaude(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const client = new Anthropic({ apiKey })

  let message
  try {
    message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    })
  } catch (err) {
    throw new StoryGenerationError('Claude API request failed', err)
  }

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new StoryGenerationError('Unexpected response type from Claude: ' + content.type)
  }
  return content.text
}

export async function generateStory(
  apiKey: string,
  input: BookFormInput,
  tier: LexileTier,
  characterDescription?: string
): Promise<StoryJSON> {
  const { systemPrompt, userPrompt } = buildStoryPrompt(input, tier, characterDescription)

  // First attempt
  try {
    const rawText = await callClaude(apiKey, systemPrompt, userPrompt)
    const cleaned = stripMarkdownFences(rawText)
    const parsed = JSON.parse(cleaned)
    return validateStoryJSON(parsed, tier.targetPages)
  } catch (err) {
    // One retry on failure
    console.warn('First Claude attempt failed, retrying...', err)
  }

  // Second attempt — let errors propagate
  try {
    const rawText = await callClaude(apiKey, systemPrompt, userPrompt)
    const cleaned = stripMarkdownFences(rawText)
    const parsed = JSON.parse(cleaned)
    return validateStoryJSON(parsed, tier.targetPages)
  } catch (err) {
    throw new StoryGenerationError('Story generation failed after 2 attempts', err)
  }
}
