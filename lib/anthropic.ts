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

  const systemPrompt = `You are a master children's book author. Your specialty is writing personalized, illustrated picture books that are precisely calibrated to a child's reading development level using the Lexile Framework for Reading.

## YOUR TASK

Write a complete 10-page illustrated children's book. You will return ONLY valid JSON — no prose, no explanation, no markdown fences — matching the exact schema specified below.

## LEXILE TIER CONSTRAINTS (THIS IS THE MOST IMPORTANT RULE)

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
- Example page: "Sam found a red ball. The ball was big and round."
` : ''}${tier.tier === 2 ? `
- Use common sight words and simple phonics words. Avoid multi-syllable uncommon words.
- Compound sentences are allowed (joined with "and" or "but"). One idea per sentence.
- Maximum sentence length: 12 words.
- Introduce simple emotion words (happy, scared, excited, surprised).
- Example page: "Maya looked all around the yard. She called the puppy's name, but it did not come."
` : ''}${tier.tier === 3 ? `
- Use varied sentence structures: simple, compound, and short complex sentences.
- Include descriptive adjectives and simple adverbs.
- Introduce some grade-appropriate vocabulary (curious, discover, whispered, enormous).
- Build a clear cause-and-effect structure across the story.
- Example page: "Maya crept quietly through the tall grass, listening for any sound. Somewhere nearby, she could hear a tiny whimper."
` : ''}${tier.tier === 4 ? `
- Use complex sentence structures with subordinate clauses (when, because, although, while).
- Include richer vocabulary: synonyms, multi-syllable words, figurative expressions.
- Show character internal thoughts and emotions, not just actions.
- The story should have a clear three-act structure: setup, rising action, resolution.
- Example page: "Although Zephyr had searched for hours, the street where ${input.childName} had last seen the puppy was completely empty."
` : ''}${tier.tier === 5 ? `
- Use sophisticated sentence variety: complex, compound-complex, and varied rhythms.
- Include literary devices: metaphor, simile, personification, foreshadowing.
- Rich vocabulary expected: abstract nouns, precise verbs, domain-specific terms where appropriate.
- Characters should have psychological depth. Theme should have layers of meaning.
- The story arc should feel complete: inciting incident, complication, climax, resolution, reflection.
- Example page: "The paradox hung in ${input.childName}'s mind like a splinter — if ${pronouns.subject} returned to the past to prevent the accident, ${input.childName} would never have discovered the time machine at all."
` : ''}

## CHARACTER DESCRIPTION (CRITICAL FOR VISUAL CONSISTENCY)

The JSON you return includes a \`character_description\` field. This is the single most important element for visual consistency across all 10 illustrations.

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
- The final page should have a satisfying, warm resolution appropriate for a bedtime story.${input.sidekick ? `
- The story includes a companion character: **${input.sidekick}**. This sidekick should appear in most pages of the story alongside ${input.childName}. Add a brief, concrete physical description of the sidekick to the \`character_description\` field so it can be included in illustrations for visual consistency.` : ''}

## IMAGE PROMPTS

Each page includes an \`image_prompt\` field. This is sent directly to an image generation model (Ideogram). Write it as a visual scene description, not prose:

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

REMINDER: Return ONLY valid JSON. Any prose before or after the JSON will cause a parse failure and the story will be rejected.`

  const userPrompt = `Write a personalized children's book with the following details:

- **Child's name:** ${input.childName}
- **Child's age:** ${input.age} years old
- **Pronouns:** ${input.pronouns} (use ${pronouns.subject}/${pronouns.object}/${pronouns.possessive})
- **Book theme:** ${input.theme}${input.sidekick ? `
- **Pet or sidekick:** ${input.sidekick} — include this companion throughout the story` : ''}
- **Reading level:** ${tier.name} Reader (${tier.lexileRange}) — STRICTLY enforce ${tier.wordsPerPage} per page

Make ${input.childName} the hero of the story. The story should feel personal, warm, and magical — the kind of book a child asks to hear again and again.

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
      max_tokens: 4096,
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
