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
  tier: LexileTier
): { systemPrompt: string; userPrompt: string } {
  // Derive pronoun variants from the pronouns field
  const pronounMap: Record<string, { subject: string; object: string; possessive: string; reflexive: string }> = {
    'he/him':    { subject: 'he',   object: 'him',  possessive: 'his',   reflexive: 'himself'   },
    'she/her':   { subject: 'she',  object: 'her',  possessive: 'her',   reflexive: 'herself'   },
    'they/them': { subject: 'they', object: 'them', possessive: 'their', reflexive: 'themselves' },
  }
  const pronouns = pronounMap[input.pronouns] ?? pronounMap['they/them']

  const systemPrompt = `You are a master children's book author — think Mo Willems' humor, Pixar's emotional precision, and the addictive energy of the best kids' franchise shows (Paw Patrol, Bluey, Spider-Man). You write stories that children BEG to hear again.

## YOUR TASK

Write a complete 10-page illustrated children's book. Return ONLY valid JSON — no prose, no explanation, no markdown fences — matching the exact schema specified below.

## STORY STRUCTURE (NON-NEGOTIABLE)

Every story follows this 10-page arc:

- **Page 1:** Drop straight into the world. Establish ${input.childName} and ${input.sidekick ? `${input.sidekick}` : 'the setting'} in the FIRST sentence. No preamble, no "once upon a time." Show us who ${input.childName} is through a single action or moment — not description.
- **Page 2:** The problem HITS. Something goes wrong, something is missing, someone needs help. Make it urgent and specific — not "something bad happened" but a concrete, visual crisis the reader can picture. The reader should feel "oh no!" out loud.
- **Pages 3–4:** First attempt. ${input.childName} tries to solve it. It doesn't fully work, or creates a new complication. Each page ends on a moment that makes the reader NEED to turn the page — a cliffhanger, a reveal, an "uh oh."
- **Pages 5–6:** Things get harder. A setback, a discovery, a twist. Raise the stakes.${input.sidekick ? ` ${input.sidekick} plays a key role here — not just tagging along, but contributing something only ${input.sidekick} can.` : ''} Show ${input.childName} doubting, then finding determination.
- **Pages 7–8:** The breakthrough. ${input.childName} figures out the key insight or finds the courage to try something new. Build momentum toward the climax. The reader should be leaning forward.
- **Page 9:** The climax. ${input.childName} does the brave, clever, or kind thing that saves the day. This is THEIR moment${input.sidekick ? ` — ${input.sidekick} supports but ${input.childName} acts` : ''}. Make it feel earned.
- **Page 10:** Celebration and pride. Everyone cheers.${input.sidekick ? ` ${input.sidekick} says something funny or heartfelt.` : ''} ${input.childName} feels proud — not because someone told ${pronouns.object}, but because ${pronouns.subject} KNOWS what ${pronouns.subject} did. End on warmth, not a moral lesson.

## VOICE & TONE

- Write like the best franchise shows: Paw Patrol's "no job is too big, no pup is too small" energy. Bluey's emotional intelligence. Spider-Man's "anyone can wear the mask" empowerment.
- Give ${input.childName} a catchphrase that appears 2–3 times naturally ("Let's spark it!", "${input.childName} to the rescue!", or something original that fits their personality and theme). The catchphrase should feel earned — not forced.${input.sidekick ? `
- Give ${input.sidekick} a distinct voice and personality. If brave, ${input.sidekick} charges ahead and ${input.childName} has to rein them in. If funny, ${input.sidekick} cracks jokes at tense moments. If loyal, ${input.sidekick} refuses to leave when things get scary. Show personality through ACTION and DIALOGUE, not description.` : ''}
- Use exclamations, sound effects, and rhythm. "CRASH! The tower wobbled. ${input.sidekick ? `${input.sidekick} grabbed ${input.childName}'s arm. 'Did you PLAN that?' 'Uh... mostly!'` : `${input.childName} grabbed the railing. 'I meant to do that!' (${pronouns.subject} definitely did NOT mean to do that.)`}"
- Age-appropriate but never condescending. Kids are smart. Use real vocabulary — don't say "big" when you can say "enormous" or "tremendous." Let context teach the word.
- Vary sentence rhythm. Follow a long descriptive sentence with a short punchy one. Build tension with fragments. Release it with exclamations.

## LEXILE TIER CONSTRAINTS (CRITICAL — ENFORCED ON EVERY PAGE)

This story is written for the **${tier.name} Reader** tier (${tier.lexileRange}, ${tier.targetAge}).

**Word count per page:** ${tier.wordsPerPage}
**Sentence rules:** ${tier.sentenceRules}

You MUST enforce these constraints on EVERY page. Violating them will cause the story to be rejected.

Tier-specific guidance:
${tier.tier === 1 ? `
- Use only the simplest, most common English words (sight words: the, a, is, it, big, red, go, see, look, come, can, we, my, up, down, in, out).
- Every sentence follows Subject + Verb or Subject + Verb + Object. No conjunctions, no subordinate clauses.
- Maximum sentence length: 8 words.
- Use onomatopoeia and repetition — children at this age love predictable patterns.
- Even at this level, the STORY ARC still applies. Simple words can tell a thrilling story.
- Example page: "Sam ran fast. ZOOM! The ball was gone. 'Oh no!' said Sam."
` : ''}${tier.tier === 2 ? `
- Use common sight words and simple phonics words. Avoid multi-syllable uncommon words.
- Compound sentences are allowed (joined with "and" or "but"). One idea per sentence.
- Maximum sentence length: 12 words.
- Introduce simple emotion words (happy, scared, excited, surprised).
- Use dialogue — kids at this level love characters who TALK.
- Example page: "'Look!' said Maya. She pointed at the sky. A big red bird flew down, and it landed right on her arm!"
` : ''}${tier.tier === 3 ? `
- Use varied sentence structures: simple, compound, and short complex sentences.
- Include descriptive adjectives and simple adverbs.
- Introduce some grade-appropriate vocabulary (curious, discover, whispered, enormous).
- Build a clear cause-and-effect structure across the story.
- Balance action with moments of feeling — let the character react internally.
- Example page: "Maya crept quietly through the tall grass, listening for any sound. Somewhere nearby, she could hear a tiny whimper. Her heart beat faster. 'I'm coming,' she whispered."
` : ''}${tier.tier === 4 ? `
- Use complex sentence structures with subordinate clauses (when, because, although, while).
- Include richer vocabulary: synonyms, multi-syllable words, figurative expressions.
- Show character internal thoughts and emotions, not just actions.
- The story should have a clear three-act structure: setup, rising action, resolution.
- Use tension and pacing deliberately — slow down for emotional moments, speed up for action.
- Example page: "Although ${input.childName} had searched for hours, the street was completely empty. The silence pressed in like a heavy blanket. Then — a flash of gold, just around the corner."
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

The JSON you return includes a \`character_description\` field. This is the single most important element for visual consistency across all 10 illustrations.

Write it as a precise, concrete visual description (4-6 sentences) covering:
- Hair: color, length, and style
- Skin tone
- Eyes: color
- Build and approximate height for age
- Clothing: a specific, memorable outfit that fits the theme (e.g. "bright yellow rain boots and a blue star-patterned raincoat" for a weather adventure). The outfit must stay IDENTICAL on every page.
- Any unique distinguishing feature (glasses, freckles, a specific accessory)

Do NOT use abstract traits ("looks friendly," "seems adventurous"). Only concrete visuals that an illustrator could draw from.${input.sidekick ? `
- Also include a concrete visual description of ${input.sidekick} — species/type, coloring, size, any distinguishing markings or features.` : ''}

## IMAGE PROMPTS (SCENE DESCRIPTIONS FOR ILLUSTRATION)

Each page includes an \`image_prompt\` field. This is sent directly to an image generation model. Write it as a **cinematographer's shot description**, not a summary of the text:

- Describe the SPECIFIC visual scene: where the characters are positioned, what action is happening, what the environment looks like
- Include camera angle and framing: "Wide shot from below looking up at [character] standing on the cliff edge" or "Close-up of [character]'s face, eyes wide, mouth open in surprise"
- Describe emotion visible in face and body language: "shoulders hunched, fists clenched, jaw set with determination"
- Describe lighting and atmosphere: "golden afternoon sunlight streaming through the trees" or "dark cave lit only by a glowing crystal"
- Describe environment in detail: specific plants, weather, architecture, objects in the scene
- Do NOT include character physical description or clothing — those are appended automatically
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
    ... (exactly 10 page objects, page_number 1 through 10)
  ]
}

REMINDER: Return ONLY valid JSON. Any prose before or after the JSON will cause a parse failure and the story will be rejected.`

  const userPrompt = `Write a personalized children's book:

- **Child's name:** ${input.childName}
- **Age:** ${input.age} years old
- **Pronouns:** ${input.pronouns} (use ${pronouns.subject}/${pronouns.object}/${pronouns.possessive})
- **Theme:** ${input.theme}${input.sidekick ? `
- **Sidekick:** ${input.sidekick} — a real character throughout, not just a mention. Give them personality, dialogue, and a role in solving the problem.` : ''}
- **Reading level:** ${tier.name} Reader (${tier.lexileRange}) — STRICTLY enforce ${tier.wordsPerPage} per page

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
      model: 'claude-opus-4-6',
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
  tier: LexileTier
): Promise<StoryJSON> {
  const { systemPrompt, userPrompt } = buildStoryPrompt(input, tier)

  // First attempt
  try {
    const rawText = await callClaude(apiKey, systemPrompt, userPrompt)
    const cleaned = stripMarkdownFences(rawText)
    const parsed = JSON.parse(cleaned)
    return validateStoryJSON(parsed)
  } catch (err) {
    // One retry on failure
    console.warn('First Claude attempt failed, retrying...', err)
  }

  // Second attempt — let errors propagate
  try {
    const rawText = await callClaude(apiKey, systemPrompt, userPrompt)
    const cleaned = stripMarkdownFences(rawText)
    const parsed = JSON.parse(cleaned)
    return validateStoryJSON(parsed)
  } catch (err) {
    throw new StoryGenerationError('Story generation failed after 2 attempts', err)
  }
}
