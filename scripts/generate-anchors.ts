/**
 * scripts/generate-anchors.ts
 *
 * One-time script to generate anchor images for the 8 pre-made characters.
 *
 * WORKFLOW:
 *   1. Iterate cheaply:  npx tsx scripts/generate-anchors.ts --model schnell
 *   2. Lock prompts:     edit CHARACTERS array below until happy
 *   3. Generate finals:  npx tsx scripts/generate-anchors.ts --model dev --upload
 *
 * FLAGS:
 *   --model schnell    FLUX Schnell (~$0.003/img, fast, good enough for iteration)
 *   --model dev        FLUX Dev    (~$0.055/img, final quality, use once)
 *   --id zib           Only generate one character by id (for targeted iteration)
 *   --upload           Upload to Supabase Storage and print URLs (finals only)
 *   --output ./anchors Save images locally to this directory
 *
 * OUTPUTS:
 *   - Saves images to ./anchors/<id>-<timestamp>.webp
 *   - With --upload: prints the public Supabase URL to paste into lib/characters.ts
 *
 * RUN:
 *   REPLICATE_API_TOKEN=... SUPABASE_URL=... SUPABASE_SERVICE_KEY=... \
 *   npx tsx scripts/generate-anchors.ts --model schnell
 */

import Replicate from 'replicate'
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Character definitions — edit prompts here during iteration
// ---------------------------------------------------------------------------

const CHARACTERS = [
  {
    id: 'zib',
    name: 'Zib',
    species: 'alien',
    prompt: `A small round alien creature with smooth lavender skin, three antenna with glowing teal tips, huge expressive dark eyes, stubby four-fingered hands, toddler-sized body with a slightly oversized head. Friendly and curious expression. Full body, standing pose. Pure white background. Clean vector-art style, bold outlines, vibrant colors. No text, no humans.`,
  },
  {
    id: 'ember',
    name: 'Ember',
    species: 'dragon',
    prompt: `A small chubby dragon with warm orange and red scales, tiny rounded wings, stubby tail, big amber eyes with a gentle glow, small rounded snout with a wisp of smoke curling out. Toddler-sized, adorable proportions. Full body, standing pose. Pure white background. Clean vector-art style, bold outlines, vibrant colors. No text, no humans.`,
  },
  {
    id: 'punch',
    name: 'Punch',
    species: 'orangutan',
    prompt: `A small chubby baby orangutan with rich reddish-brown fluffy fur, a pale cream face with huge round expressive eyes, round flat nose, wide goofy grin showing tiny teeth, long floppy arms almost touching the ground, toddler-sized compact body. Standing pose, arms slightly out. Pure white background. Clean cartoon vector-art style, bold outlines, warm colors. Adorable and funny, not scary. No text, no humans.`,
  },
  {
    id: 'boo',
    name: 'Boo',
    species: 'cloud spirit',
    prompt: `A fluffy rounded cloud creature with a soft white-blue body, two stubby legs, tiny star-shaped hands, rosy cheek puffs, wide dark eyes with a dreamy expression, occasional sparkles drifting off the body. Toddler-sized, very round. Full body, standing pose. Pure white background. Clean vector-art style, bold outlines, vibrant colors. No text, no humans.`,
  },
  {
    id: 'cog',
    name: 'Cog',
    species: 'robot',
    prompt: `A small friendly robot with a rounded rectangular body, soft lime green metal panels, circular viewport eyes with warm light, stubby boxy limbs, a small antenna with a star on top, expressive LED eyebrows showing delight. Toddler-sized, cute proportions. Full body, standing pose. Pure white background. Clean vector-art style, bold outlines, vibrant colors. No text, no humans.`,
  },
  {
    id: 'fern',
    name: 'Fern',
    species: 'fox',
    prompt: `A small magical fox with deep forest-green fur, lighter sage chest patch, bushy tail with a white tip, pointed ears with inner gold flecks, big bright hazel eyes, four tiny paws. Toddler-fox proportions, very compact and round. Full body, standing pose. Pure white background. Clean vector-art style, bold outlines, vibrant colors. No text, no humans.`,
  },
  {
    id: 'mochi',
    name: 'Mochi',
    species: 'bear',
    prompt: `A small round bear cub with soft cream and pale pink coloring, tiny rounded ears, wide shiny black eyes, a little button nose, stubby arms, very compact toddler-sized body that looks like it could be squishy. Full body, standing pose. Pure white background. Clean vector-art style, bold outlines, vibrant colors. No text, no humans.`,
  },
  {
    id: 'lumi',
    name: 'Lumi',
    species: 'jellyfish',
    prompt: `A small round jellyfish creature that floats just off the ground, glowing iridescent blue-purple translucent bell body, big warm eyes inside the bell, four short trailing tendrils like little arms, soft bioluminescent shimmer around the edges. Toddler-sized, ethereal but cute. Full body, floating pose. Pure white background. Clean vector-art style, bold outlines, vibrant colors. No text, no humans.`,
  },
]

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

const MODELS = {
  schnell: 'black-forest-labs/flux-schnell',
  dev: 'black-forest-labs/flux-dev',
} as const

type ModelKey = keyof typeof MODELS

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2)
  const model: ModelKey = args.includes('--model')
    ? (args[args.indexOf('--model') + 1] as ModelKey)
    : 'schnell'
  const idFlag = args.includes('--id') ? args[args.indexOf('--id') + 1] : null
  const upload = args.includes('--upload')
  const outputDir = args.includes('--output')
    ? args[args.indexOf('--output') + 1]
    : './anchors'

  if (!['schnell', 'dev'].includes(model)) {
    console.error(`Unknown model: ${model}. Use 'schnell' or 'dev'.`)
    process.exit(1)
  }

  return { model, idFlag, upload, outputDir }
}

// ---------------------------------------------------------------------------
// Image generation
// ---------------------------------------------------------------------------

async function generateImage(
  replicate: Replicate,
  model: ModelKey,
  prompt: string
): Promise<Buffer> {
  const input = model === 'schnell'
    ? { prompt, num_inference_steps: 4, output_format: 'webp' }
    : { prompt, num_inference_steps: 28, guidance: 3.5, output_format: 'webp' }

  const output = await replicate.run(MODELS[model], { input }) as string | string[]
  const url = Array.isArray(output) ? output[0] : output

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

// ---------------------------------------------------------------------------
// Supabase upload
// ---------------------------------------------------------------------------

async function uploadToSupabase(
  supabaseUrl: string,
  serviceKey: string,
  characterId: string,
  imageBuffer: Buffer
): Promise<string> {
  const supabase = createClient(supabaseUrl, serviceKey)
  const filePath = `characters/${characterId}.webp`

  const { error } = await supabase.storage
    .from('books')
    .upload(filePath, imageBuffer, {
      contentType: 'image/webp',
      upsert: true,
    })

  if (error) throw new Error(`Supabase upload failed: ${error.message}`)

  const { data } = supabase.storage.from('books').getPublicUrl(filePath)
  return data.publicUrl
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { model, idFlag, upload, outputDir } = parseArgs()

  const replicateToken = process.env.REPLICATE_API_TOKEN
  if (!replicateToken) {
    console.error('REPLICATE_API_TOKEN env var required')
    process.exit(1)
  }

  if (upload && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)) {
    console.error('--upload requires SUPABASE_URL and SUPABASE_SERVICE_KEY env vars')
    process.exit(1)
  }

  const replicate = new Replicate({ auth: replicateToken })

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  const targets = idFlag
    ? CHARACTERS.filter(c => c.id === idFlag)
    : CHARACTERS

  if (targets.length === 0) {
    console.error(`No character found with id: ${idFlag}`)
    process.exit(1)
  }

  console.log(`\n🎨 Generating ${targets.length} character(s) with FLUX ${model.toUpperCase()}`)
  console.log(`   Model: ${MODELS[model]}`)
  console.log(`   Upload: ${upload ? 'yes (Supabase)' : 'no (local only)'}`)
  console.log(`   Output: ${outputDir}\n`)

  const results: Record<string, string> = {}

  for (const char of targets) {
    process.stdout.write(`  ${char.name} (${char.species})... `)
    const start = Date.now()

    try {
      const imageBuffer = await generateImage(replicate, model, char.prompt)
      const timestamp = Date.now()
      const localPath = path.join(outputDir, `${char.id}-${timestamp}.webp`)
      fs.writeFileSync(localPath, imageBuffer)

      let finalUrl = localPath

      if (upload) {
        finalUrl = await uploadToSupabase(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_KEY!,
          char.id,
          imageBuffer
        )
      }

      const elapsed = ((Date.now() - start) / 1000).toFixed(1)
      console.log(`✓ ${elapsed}s → ${finalUrl}`)
      results[char.id] = finalUrl
    } catch (err) {
      console.log(`✗ FAILED`)
      console.error(`    ${err}`)
    }
  }

  // Print lib/characters.ts paste-ready anchor URLs
  if (upload && Object.keys(results).length > 0) {
    console.log('\n─────────────────────────────────────────────')
    console.log('Paste these anchorUrl values into lib/characters.ts:')
    console.log('─────────────────────────────────────────────')
    for (const [id, url] of Object.entries(results)) {
      console.log(`  ${id}: '${url}',`)
    }
    console.log('─────────────────────────────────────────────\n')
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
