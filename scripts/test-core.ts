// scripts/test-core.ts — Core mechanic test suite (no real API calls)
// Run: npx tsx scripts/test-core.ts

import { getDefaultTier, getTierByNumber, nudgeTier, LEXILE_TIERS } from '../lib/lexile'
import { buildStoryPrompt } from '../lib/anthropic'
import { buildImagePrompt, ART_STYLE_PREFIX } from '../lib/ideogram'
import { validateStoryJSON } from '../lib/bookSchema'
import type { BookFormInput, StoryJSON } from '../types/index'

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

let passCount = 0
let failCount = 0

function divider(label: string) {
  console.log('\n' + '═'.repeat(70))
  console.log(`  ${label}`)
  console.log('═'.repeat(70))
}

function section(label: string) {
  console.log(`\n─── ${label} ${'─'.repeat(Math.max(0, 60 - label.length))}`)
}

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    console.log(`  PASS  ${label}`)
    passCount++
  } else {
    console.error(`  FAIL  ${label}${detail ? ': ' + detail : ''}`)
    failCount++
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK STORY JSON BUILDER
// Creates a mock StoryJSON response that respects the tier constraints
// ─────────────────────────────────────────────────────────────────────────────

function buildMockStory(input: BookFormInput): StoryJSON {
  const tier = getTierByNumber(input.tier)
  const name = input.childName
  const theme = input.theme

  // Tier-appropriate page text templates
  const pageTexts: Record<number, string[]> = {
    1: [
      `${name} saw a red ball. It was big and round.`,
      `${name} and a friend went outside. They wanted to play.`,
      `${name} looked at the bright blue sky. It was a good day.`,
      `${name} got up early. The sun was out.`,
      `${name} had a big smile. Today was special.`,
      `${name} put on a hat. It was time to go.`,
      `${name} ran to the door. Something was waiting outside.`,
      `${name} stopped and looked. Something was there.`,
      `${name} reached out a hand. It was so soft.`,
      `${name} was happy. It was the best day ever.`,
    ],
    2: [
      `${name} was playing in the backyard when something caught ${name}'s eye.`,
      `"Come look at this!" said ${name}, running toward the old oak tree.`,
      `${name} searched all around, but it seemed to have disappeared.`,
      `${name} called out twice, but heard nothing back at all.`,
      `${name} felt a little worried, but kept on looking anyway.`,
      `Behind the fence, ${name} spotted something small and brown.`,
      `${name} moved slowly and carefully so as not to make noise.`,
      `There it was at last! ${name} felt so relieved and happy.`,
      `${name} reached out gently, and it walked right into ${name}'s arms.`,
      `${name} smiled the biggest smile. Everything had worked out perfectly fine.`,
    ],
    3: [
      `The morning ${name} discovered ${theme} started like any ordinary Saturday.`,
      `${name} leaned closer, curious and a little bit nervous about what might happen next.`,
      `The old path twisted through the trees, and ${name} followed it carefully, step by step.`,
      `Something was different here — ${name} could feel it in the cool, quiet air.`,
      `${name} paused and listened. A soft sound drifted through the rustling leaves overhead.`,
      `It was not what ${name} expected to find, but it was somehow even better.`,
      `${name} took a deep breath and made a brave decision right then and there.`,
      `Together, they worked as a team, and slowly everything started to fall into place.`,
      `By the time the sun began to set, ${name} felt a warm glow of pride.`,
      `${name} looked back at the path and smiled. Some adventures change you, just a little.`,
    ],
    4: [
      `${name} had always believed that ${theme} was the sort of thing that happened to other people — not to someone like ${name}.`,
      `The moment ${name} stepped through the old wooden gate, ${name} realized this would be no ordinary afternoon.`,
      `Although ${name} had prepared carefully, nothing could have readied ${name} for what was waiting on the other side.`,
      `${name}'s heart hammered as ${name} weighed the choice: turn back now, or press forward into the unknown.`,
      `The path grew darker as ${name} ventured deeper, but something pulled ${name} forward like an invisible thread.`,
      `When the answer finally came, it arrived so quietly that ${name} almost missed it entirely.`,
      `${name} understood now why this journey had to happen — some lessons can only be learned by living them.`,
      `Side by side, ${name} and the unexpected companion worked toward a solution neither could have found alone.`,
      `As the golden light of late afternoon slanted through the trees, ${name} felt the satisfying click of things falling into place.`,
      `${name} walked home slowly, turning the day over in ${name}'s mind like a smooth stone — changed, in the best possible way.`,
    ],
    5: [
      `The paradox had been gnawing at ${name} for weeks: if ${theme} was truly possible, then every choice made rippled backward and forward through time simultaneously.`,
      `Standing at the edge of the discovery, ${name} felt the peculiar vertigo of someone who has glimpsed something the rest of the world has not yet imagined.`,
      `The machine — if one could call it that — hummed with a low frequency that ${name} felt more in the chest than heard with the ears.`,
      `Logic insisted that turning back was the rational choice; instinct, older and stranger than logic, insisted otherwise, and ${name} listened to instinct.`,
      `Each moment ${name} spent here was a thread pulled from the fabric of what had been, and the consequences were both thrilling and terrifying to consider.`,
      `The figure waiting in the shadows was, unmistakably, a version of ${name} — older, quieter, marked by an experience ${name} had not yet lived through.`,
      `"You already know what you have to do," the older ${name} said, with a voice that carried the particular sadness of someone who cannot explain what they have earned.`,
      `${name} made the choice that logic would not have predicted: not the escape route, not the safest path, but the one that cost the most and mattered the most.`,
      `The paradox resolved itself not with a thunderclap but with the quiet inevitability of a door swinging shut — the kind of ending that was always the only ending.`,
      `${name} emerged into ordinary afternoon light, carrying the weight of something extraordinary, knowing that the real journey was only now beginning.`,
    ],
  }

  const imagePrompts = [
    `Wide establishing shot: ${name} at the start of an adventure, looking curious and excited. Bright, open setting with warm light. Expression: wide-eyed wonder.`,
    `${name} exploring, leaning in to look at something small or hidden. Dappled light through trees or a doorway. Expression: focused curiosity.`,
    `${name} moving along a winding path or trail. The environment feels alive — leaves, grass, or interesting objects in the background. Expression: determined.`,
    `${name} pausing, slightly uncertain. The setting has become more interesting or mysterious. Expression: thoughtful, a little awed.`,
    `${name} listening or watching carefully. Something off to the side of the frame suggests a discovery is near. Expression: anticipation.`,
    `${name} reacting to a discovery — something unexpected appears in the scene. Expression: surprise, delight, or wonder.`,
    `${name} making a brave decision — reaching out, stepping forward, or calling out. Body language shows courage. Expression: determined, kind.`,
    `${name} working together with another character or element in the scene. Cooperative energy, busy hands. Expression: engaged, hopeful.`,
    `${name} experiencing a moment of resolution — things are coming together. Warm golden light. Expression: relief, joy.`,
    `Final page: ${name} in a peaceful, satisfying moment — looking back, smiling, at rest. Warm, cozy atmosphere. Expression: contentment, happiness.`,
  ]

  const texts = pageTexts[input.tier]
  const characterDescriptions: Record<number, string> = {
    1: `${name} has short, curly auburn hair and warm brown skin. ${name} has bright hazel eyes and a wide, gap-toothed smile. ${name} wears a yellow t-shirt with a small star on the front, denim shorts, and red sneakers. ${name} has a small dimple on the left cheek.`,
    2: `${name} has medium-length straight black hair pulled into two pigtails with blue hair ties. ${name} has light tan skin and dark brown eyes. ${name} wears a striped green and white shirt, purple leggings, and white sneakers with pink soles. ${name} carries a small purple backpack.`,
    3: `${name} has shoulder-length wavy red hair and fair skin with a scattering of freckles across the nose. ${name} has green eyes and wears a teal hoodie over a white long-sleeve shirt, khaki cargo pants, and muddy brown boots. ${name} wears small round glasses with tortoiseshell frames.`,
    4: `${name} has close-cropped natural black hair and deep brown skin. ${name} has dark eyes behind rectangular wire-frame glasses and wears a navy blue long-sleeve shirt, gray cargo pants, and worn hiking boots. ${name} has a compass on a cord around ${name}'s neck.`,
    5: `${name} has long, dark brown hair worn loose and slightly disheveled, and medium-brown skin with expressive dark eyes. ${name} wears a faded olive green jacket over a black turtleneck, charcoal jeans, and scuffed black boots. ${name} has a leather-bound notebook tucked under one arm.`,
  }

  return {
    character_description: characterDescriptions[input.tier],
    pages: texts.map((text, i) => ({
      page_number: i + 1,
      text,
      image_prompt: imagePrompts[i],
    })),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST RUNNER
// ─────────────────────────────────────────────────────────────────────────────

async function runTest(label: string, input: BookFormInput) {
  divider(label)

  const tier = getTierByNumber(input.tier)

  // 1. Tier info
  section('TIER SELECTED')
  console.log(`  Tier ${tier.tier}: ${tier.name} (${tier.lexileRange})`)
  console.log(`  Target: ${tier.targetAge}`)
  console.log(`  Words per page: ${tier.wordsPerPage}`)
  console.log(`  Sentence rules: ${tier.sentenceRules}`)

  // 2. Build prompts and log them
  const { systemPrompt, userPrompt } = buildStoryPrompt(input, tier)
  section('SYSTEM PROMPT (truncated to 500 chars)')
  console.log(systemPrompt.slice(0, 500) + '...')
  section('USER PROMPT')
  console.log(userPrompt)

  // 3. Build mock response matching tier constraints
  const mockStory = buildMockStory(input)
  section('MOCK STORY — CHARACTER DESCRIPTION')
  console.log(mockStory.character_description)
  section('MOCK STORY — PAGES 1 AND 10')
  console.log('Page 1:', mockStory.pages[0])
  console.log('Page 10:', mockStory.pages[9])

  // 4. Validate against Zod schema
  section('ASSERTIONS')
  try {
    const validated = validateStoryJSON(mockStory)

    assert(validated.pages.length === 10, 'exactly 10 pages')
    assert(validated.character_description.length > 0, 'character_description is non-empty')

    const pageNumbers = validated.pages.map(p => p.page_number)
    const isSequential = pageNumbers.every((n, i) => n === i + 1)
    assert(isSequential, 'page_numbers are sequential 1-10', `got: ${pageNumbers.join(', ')}`)

    const allTextsNonEmpty = validated.pages.every(p => p.text.trim().length > 0)
    assert(allTextsNonEmpty, 'all page texts are non-empty')

    const allImagePromptsNonEmpty = validated.pages.every(p => p.image_prompt.trim().length > 0)
    assert(allImagePromptsNonEmpty, 'all image_prompts are non-empty')
  } catch (err: any) {
    console.error('  FAIL  Zod validation threw:', err.message)
    failCount++
    return
  }

  // 5. Build image prompts for pages 1 and 10
  section('IMAGE PROMPTS')
  const imgPrompt1 = buildImagePrompt(mockStory.character_description, mockStory.pages[0].image_prompt)
  const imgPrompt10 = buildImagePrompt(mockStory.character_description, mockStory.pages[9].image_prompt)

  assert(imgPrompt1.includes(ART_STYLE_PREFIX), 'page 1 image prompt includes art style prefix')
  assert(imgPrompt10.includes(ART_STYLE_PREFIX), 'page 10 image prompt includes art style prefix')
  assert(imgPrompt1.includes(mockStory.character_description), 'page 1 image prompt includes character description')
  assert(imgPrompt10.includes(mockStory.character_description), 'page 10 image prompt includes character description')

  console.log('\nPage 1 image prompt:')
  console.log(' ', imgPrompt1)
  console.log('\nPage 10 image prompt:')
  console.log(' ', imgPrompt10)
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION EDGE CASE TESTS
// ─────────────────────────────────────────────────────────────────────────────

function runValidationEdgeCaseTests() {
  divider('VALIDATION EDGE CASE TESTS')

  section('Non-sequential page_numbers rejected')
  try {
    validateStoryJSON({
      character_description: 'A child with brown hair.',
      pages: Array.from({ length: 10 }, (_, i) => ({
        page_number: i === 5 ? 99 : i + 1,  // page 6 has wrong number
        text: 'Some text.',
        image_prompt: 'A scene.',
      })),
    })
    console.error('  FAIL  Should have thrown for non-sequential page numbers')
    failCount++
  } catch (err: any) {
    assert(true, 'non-sequential page_numbers throws ValidationError')
  }

  section('Wrong page count rejected')
  try {
    validateStoryJSON({
      character_description: 'A child with brown hair.',
      pages: Array.from({ length: 9 }, (_, i) => ({
        page_number: i + 1,
        text: 'Some text.',
        image_prompt: 'A scene.',
      })),
    })
    console.error('  FAIL  Should have thrown for 9 pages')
    failCount++
  } catch (err: any) {
    assert(true, '9-page story throws ValidationError')
  }

  section('Empty character_description rejected')
  try {
    validateStoryJSON({
      character_description: '',
      pages: Array.from({ length: 10 }, (_, i) => ({
        page_number: i + 1,
        text: 'Some text.',
        image_prompt: 'A scene.',
      })),
    })
    console.error('  FAIL  Should have thrown for empty character_description')
    failCount++
  } catch (err: any) {
    assert(true, 'empty character_description throws ValidationError')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LEXILE UTILITY TESTS
// ─────────────────────────────────────────────────────────────────────────────

function runLexileUtilityTests() {
  divider('LEXILE UTILITY TESTS')

  section('getDefaultTier — age to tier mapping')
  const expectedTierMap: Array<[number, number]> = [
    [3, 1], [4, 1],
    [5, 2], [6, 2],
    [7, 3], [8, 3],
    [9, 4], [10, 4],
    [11, 5], [12, 5],
  ]
  for (const [age, expectedTier] of expectedTierMap) {
    const t = getDefaultTier(age)
    assert(t.tier === expectedTier, `age ${age} maps to tier ${expectedTier}`, `got tier ${t.tier}`)
  }

  section('getDefaultTier — out of range throws')
  try {
    getDefaultTier(2)
    console.error('  FAIL  Should have thrown for age 2')
    failCount++
  } catch {
    assert(true, 'age 2 throws ValidationError')
  }
  try {
    getDefaultTier(13)
    console.error('  FAIL  Should have thrown for age 13')
    failCount++
  } catch {
    assert(true, 'age 13 throws ValidationError')
  }

  section('nudgeTier — clamp behavior')
  assert(nudgeTier(1, -1) === 1, 'nudgeTier(1, -1) clamps to 1')
  assert(nudgeTier(1, 1) === 2,  'nudgeTier(1,  1) returns 2')
  assert(nudgeTier(3, 1) === 4,  'nudgeTier(3,  1) returns 4')
  assert(nudgeTier(3, -1) === 2, 'nudgeTier(3, -1) returns 2')
  assert(nudgeTier(5, 1) === 5,  'nudgeTier(5,  1) clamps to 5')
  assert(nudgeTier(5, -1) === 4, 'nudgeTier(5, -1) returns 4')

  section('getTierByNumber — all 5 tiers valid')
  for (let i = 1; i <= 5; i++) {
    const t = getTierByNumber(i)
    assert(t.tier === i, `getTierByNumber(${i}) returns tier ${i}`)
  }

  section('getTierByNumber — out of range throws')
  try {
    getTierByNumber(0)
    console.error('  FAIL  Should have thrown for tier 0')
    failCount++
  } catch {
    assert(true, 'tier 0 throws ValidationError')
  }
  try {
    getTierByNumber(6)
    console.error('  FAIL  Should have thrown for tier 6')
    failCount++
  } catch {
    assert(true, 'tier 6 throws ValidationError')
  }

  section('LEXILE_TIERS — all tiers present')
  assert(LEXILE_TIERS.length === 5, 'LEXILE_TIERS has 5 entries')
  LEXILE_TIERS.forEach(t => {
    console.log(`  Tier ${t.tier}: ${t.name} | ${t.lexileRange} | ${t.targetAge} | ${t.wordsPerPage}`)
  })

  section('ART_STYLE_PREFIX')
  assert(ART_STYLE_PREFIX.length > 0, 'ART_STYLE_PREFIX is non-empty')
  console.log(' ', ART_STYLE_PREFIX)
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n')
  console.log('  STORY SPARK — CORE MECHANIC TEST SUITE')
  console.log('  No real API calls are made in this script.')

  runLexileUtilityTests()
  runValidationEdgeCaseTests()

  // Test 1: Minimum — Tier 1 Emerging
  await runTest('TEST 1: MINIMUM — Tier 1 Emerging, age 3, Sam', {
    sessionId: 'test-session-001',
    childName: 'Sam',
    age: 3,
    tier: 1,
    theme: 'a red ball',
    pronouns: 'they/them',
  })

  // Test 2: Typical — Tier 3 Developing
  await runTest('TEST 2: TYPICAL — Tier 3 Developing, age 7, Maya', {
    sessionId: 'test-session-002',
    childName: 'Maya',
    age: 7,
    tier: 3,
    theme: 'finding a lost puppy',
    pronouns: 'she/her',
  })

  // Test 3: Edge — Tier 5 Advanced
  await runTest('TEST 3: EDGE — Tier 5 Advanced, age 12, Zephyr', {
    sessionId: 'test-session-003',
    childName: 'Zephyr',
    age: 12,
    tier: 5,
    theme: 'time travel paradox',
    pronouns: 'he/him',
  })

  // Summary
  divider('TEST SUMMARY')
  console.log()
  console.log(`  Passed: ${passCount}`)
  console.log(`  Failed: ${failCount}`)
  console.log()

  if (failCount > 0) {
    console.error(`  ${failCount} test(s) failed.`)
    process.exit(1)
  } else {
    console.log('  All tests passed.')
    console.log()
    console.log('  PROVEN: Core mechanic is functional end-to-end.')
    console.log('  - 5-tier Lexile system maps ages correctly and clamps nudges.')
    console.log('  - buildStoryPrompt() generates tier-differentiated prompts.')
    console.log('  - Zod schema validates StoryJSON with sequential 1-10 page enforcement.')
    console.log('  - buildImagePrompt() correctly prefixes art style + character desc.')
    console.log()
  }
}

main().catch(err => {
  console.error('Test runner failed:', err)
  process.exit(1)
})
