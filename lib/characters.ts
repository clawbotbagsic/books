// lib/characters.ts — Pre-made character roster for Inklings
//
// These are the 8 selectable creatures. The child's name is applied to the
// chosen character in the story (e.g. "Maya the dragon" / "Ember the dragon").
//
// anchorUrl: Public Supabase URL for the FLUX-generated anchor image.
//            Used as the reference image for consistent-character pipeline.
// storyDescription: Injected into the Claude prompt as character_description.
//                   Replaces generated physical description entirely.
// fluxPrompt: The FLUX Dev prompt used to (re)generate the anchor image.

export interface Character {
  id: string
  name: string
  species: string
  tagline: string           // shown under the name in the picker
  storyDescription: string  // fed to Claude for story + image prompt generation
  anchorUrl: string         // Supabase Storage public URL
  fluxPrompt: string        // for regenerating via scripts/generate-anchors.ts
}

const BASE_URL = 'https://sgpnvjffcymrtmpazyrl.supabase.co/storage/v1/object/public/books/characters'

export const CHARACTERS: Character[] = [
  {
    id: 'zib',
    name: 'Zib',
    species: 'alien',
    tagline: 'Little Alien',
    storyDescription: 'A small round alien creature with smooth lavender skin, three glowing teal antennae, huge dark expressive eyes, and stubby four-fingered hands. Toddler-sized with a slightly oversized head and a curious, friendly expression.',
    anchorUrl: `${BASE_URL}/zib.webp`,
    fluxPrompt: 'A small round alien creature with smooth lavender skin, three antenna with glowing teal tips, huge expressive dark eyes, stubby four-fingered hands, toddler-sized body with a slightly oversized head. Friendly and curious expression. Full body, standing pose. Pure white background. Clean vector-art style, bold outlines, vibrant colors. No text, no humans.',
  },
  {
    id: 'ember',
    name: 'Ember',
    species: 'dragon',
    tagline: 'Baby Dragon',
    storyDescription: 'A small chubby dragon with warm orange and red scales, tiny rounded wings, a stubby tail, and big amber eyes with a gentle glow. Has a small rounded snout with a wisp of smoke that curls out when excited. Toddler-sized with adorable round proportions.',
    anchorUrl: `${BASE_URL}/ember.webp`,
    fluxPrompt: 'A small chubby dragon with warm orange and red scales, tiny rounded wings, stubby tail, big amber eyes with a gentle glow, small rounded snout with a wisp of smoke curling out. Toddler-sized, adorable proportions. Full body, standing pose. Pure white background. Clean vector-art style, bold outlines, vibrant colors. No text, no humans.',
  },
  {
    id: 'punch',
    name: 'Punch',
    species: 'orangutan',
    tagline: 'Baby Orangutan',
    storyDescription: 'A small chubby baby orangutan with rich reddish-brown fluffy fur, a pale cream face, huge round expressive eyes, a round flat nose, and a wide goofy grin. Has long floppy arms that nearly touch the ground. Toddler-sized and irresistibly funny-looking.',
    anchorUrl: `${BASE_URL}/punch.webp`,
    fluxPrompt: 'A small chubby baby orangutan with rich reddish-brown fluffy fur, a pale cream face with huge round expressive eyes, round flat nose, wide goofy grin showing tiny teeth, long floppy arms almost touching the ground, toddler-sized compact body. Standing pose, arms slightly out. Pure white background. Clean cartoon vector-art style, bold outlines, warm colors. Adorable and funny, not scary. No text, no humans.',
  },
  {
    id: 'boo',
    name: 'Boo',
    species: 'cloud spirit',
    tagline: 'Cloud Sprite',
    storyDescription: 'A fluffy rounded cloud creature with a soft white-blue body, two stubby legs, tiny star-shaped hands, rosy cheek puffs, and wide dark dreamy eyes. Sparkles drift off the body occasionally. Toddler-sized and very round, like a living storm cloud that forgot to be scary.',
    anchorUrl: `${BASE_URL}/boo.webp`,
    fluxPrompt: 'A fluffy rounded cloud creature with a soft white-blue body, two stubby legs, tiny star-shaped hands, rosy cheek puffs, wide dark eyes with a dreamy expression, occasional sparkles drifting off the body. Toddler-sized, very round. Full body, standing pose. Pure white background. Clean vector-art style, bold outlines, vibrant colors. No text, no humans.',
  },
  {
    id: 'cog',
    name: 'Cog',
    species: 'robot',
    tagline: 'Tiny Robot',
    storyDescription: 'A small friendly robot with a rounded rectangular body, soft lime green metal panels, circular viewport eyes that glow with warm light, stubby boxy limbs, and a small antenna with a star on top. Has expressive LED eyebrows that show every emotion. Toddler-sized with cute proportions.',
    anchorUrl: `${BASE_URL}/cog.webp`,
    fluxPrompt: 'A small friendly robot with a rounded rectangular body, soft lime green metal panels, circular viewport eyes with warm light, stubby boxy limbs, a small antenna with a star on top, expressive LED eyebrows showing delight. Toddler-sized, cute proportions. Full body, standing pose. Pure white background. Clean vector-art style, bold outlines, vibrant colors. No text, no humans.',
  },
  {
    id: 'fern',
    name: 'Fern',
    species: 'fox',
    tagline: 'Forest Fox',
    storyDescription: 'A small magical fox with deep forest-green fur, a lighter sage chest patch, a bushy tail with a white tip, pointed ears with inner gold flecks, and bright hazel eyes. Four tiny paws and a very compact, round body. Moves with quiet, curious energy.',
    anchorUrl: `${BASE_URL}/fern.webp`,
    fluxPrompt: 'A small magical fox with deep forest-green fur, lighter sage chest patch, bushy tail with a white tip, pointed ears with inner gold flecks, big bright hazel eyes, four tiny paws. Toddler-fox proportions, very compact and round. Full body, standing pose. Pure white background. Clean vector-art style, bold outlines, vibrant colors. No text, no humans.',
  },
  {
    id: 'mochi',
    name: 'Mochi',
    species: 'bear',
    tagline: 'Magic Bear',
    storyDescription: 'A small round bear cub with soft cream and pale pink coloring, tiny rounded ears, wide shiny black eyes, and a little button nose. Has stubby arms and a very compact toddler-sized body that looks like it might be squishy. Warm and gentle in expression.',
    anchorUrl: `${BASE_URL}/mochi.webp`,
    fluxPrompt: 'A small round bear cub with soft cream and pale pink coloring, tiny rounded ears, wide shiny black eyes, a little button nose, stubby arms, very compact toddler-sized body that looks like it could be squishy. Full body, standing pose. Pure white background. Clean vector-art style, bold outlines, vibrant colors. No text, no humans.',
  },
  {
    id: 'lumi',
    name: 'Lumi',
    species: 'jellyfish',
    tagline: 'Star Sprite',
    storyDescription: 'A small round jellyfish creature that floats just off the ground, with a glowing iridescent blue-purple translucent bell body, big warm eyes inside the bell, and four short trailing tendrils like little arms. Emits a soft bioluminescent shimmer. Toddler-sized and ethereal but immediately lovable.',
    anchorUrl: `${BASE_URL}/lumi.webp`,
    fluxPrompt: 'A small round jellyfish creature that floats just off the ground, glowing iridescent blue-purple translucent bell body, big warm eyes inside the bell, four short trailing tendrils like little arms, soft bioluminescent shimmer around the edges. Toddler-sized, ethereal but cute. Full body, floating pose. Pure white background. Clean vector-art style, bold outlines, vibrant colors. No text, no humans.',
  },
]

// Lookup helpers
export const CHARACTER_MAP: Record<string, Character> = Object.fromEntries(
  CHARACTERS.map(c => [c.id, c])
)

export function getCharacter(id: string): Character | undefined {
  return CHARACTER_MAP[id]
}
