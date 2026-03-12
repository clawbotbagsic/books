// lib/replicate.ts — Character-consistent image generation via Replicate
//
// Two-phase approach:
//   Phase 1 (once per book): FLUX text-to-image → character anchor illustration
//   Phase 2 (per page): fofr/consistent-character with anchor as subject reference
//
// Cost: ~$0.025 anchor + $0.039/page vs Ideogram's ~$0.10/page with no consistency

export class ImageGenerationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'ImageGenerationError'
  }
}

// ── Constants ────────────────────────────────────────────────────────────────

export const ART_STYLE_PREFIX =
  "children's book illustration, watercolor and colored pencil, warm colors, soft edges, white background"

const REPLICATE_API_BASE = 'https://api.replicate.com/v1'

// fofr/consistent-character — FLUX IP-Adapter, same tech as Neolemon V3
// $0.039/run, open source: github.com/fofr/cog-consistent-character
// Community model: must use POST /v1/predictions with version in body (not /models/ endpoint)
const CONSISTENT_CHARACTER_VERSION =
  '6d07be932f1a1dcab88b599a25863a98e50768597ab4ed3b6c099ef0f707dc05'

// FLUX Schnell for anchor generation — fast, cheap (~$0.003–0.025), good quality
// Used to produce the character reference illustration before per-page generation
const FLUX_SCHNELL_MODEL = 'black-forest-labs/flux-schnell'

// ── Key helper ───────────────────────────────────────────────────────────────

export function getReplicateKey(req: Request): string {
  const key = req.headers.get('x-replicate-key') ?? process.env.REPLICATE_API_TOKEN
  if (!key) throw new ImageGenerationError('No Replicate API token available')
  return key
}

// ── Prompt builder ───────────────────────────────────────────────────────────

export function buildPagePrompt(pageImagePrompt: string): string {
  return `${ART_STYLE_PREFIX}. ${pageImagePrompt}`
}

export function buildAnchorPrompt(characterDescription: string): string {
  return `${ART_STYLE_PREFIX}. Character reference sheet. ${characterDescription}. Full body, front view, standing, arms at sides, hands visible, neutral expression, plain white background, illustration.`
}

// ── Replicate polling helper ─────────────────────────────────────────────────

async function waitForPrediction(
  apiKey: string,
  predictionId: string,
  timeoutMs = 120_000
): Promise<unknown> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 2000))
    const res = await fetch(`${REPLICATE_API_BASE}/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) throw new ImageGenerationError(`Replicate poll error ${res.status}`)
    const data = await res.json() as { status: string; output?: unknown; error?: string }
    if (data.status === 'succeeded') return data.output
    if (data.status === 'failed') throw new ImageGenerationError(`Replicate prediction failed: ${data.error}`)
    // status: 'starting' | 'processing' — keep polling
  }
  throw new ImageGenerationError('Replicate prediction timed out after 120s')
}

// ── Phase 1: Generate character anchor illustration ──────────────────────────
//
// Called once per book. Returns a URL to the character reference image.
// This URL is passed as `subject` to all per-page consistent-character calls.

export async function generateCharacterAnchor(
  apiKey: string,
  characterDescription: string
): Promise<string> {
  const prompt = buildAnchorPrompt(characterDescription)

  let response: Response
  try {
    response = await fetch(`${REPLICATE_API_BASE}/models/${FLUX_SCHNELL_MODEL}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Prefer: 'wait', // synchronous response if supported; falls back to polling
      },
      body: JSON.stringify({
        input: {
          prompt,
          num_outputs: 1,
          aspect_ratio: '1:1',
          output_format: 'webp',
          output_quality: 85,
        },
      }),
    })
  } catch (err) {
    throw new ImageGenerationError('Replicate anchor request failed', err)
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '(unreadable)')
    throw new ImageGenerationError(`Replicate anchor API error ${response.status}: ${errorText}`)
  }

  const data = await response.json() as {
    id: string
    status: string
    output?: string | string[]
    urls?: { get: string }
  }

  let output: unknown = data.output

  // If not immediately complete, poll for result
  if (data.status !== 'succeeded' || !output) {
    output = await waitForPrediction(apiKey, data.id)
  }

  const imageUrl = Array.isArray(output) ? output[0] : output
  if (typeof imageUrl !== 'string' || !imageUrl) {
    throw new ImageGenerationError('Anchor generation returned no image URL: ' + JSON.stringify(data))
  }

  return imageUrl
}

// ── Phase 2: Generate per-page illustration with character consistency ────────
//
// Uses fofr/consistent-character (FLUX + IP-Adapter).
// `subjectUrl` must be the anchor image URL from generateCharacterAnchor().
// `pageImagePrompt` is the cinematographic scene description from the story JSON.
// `seed` should be fixed per book for style consistency across pages.

export async function callConsistentCharacter(
  apiKey: string,
  subjectUrl: string,
  pageImagePrompt: string,
  seed?: number,
  attempt = 0
): Promise<string> {
  const prompt = buildPagePrompt(pageImagePrompt)

  let response: Response
  try {
    response = await fetch(`${REPLICATE_API_BASE}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({
        version: CONSISTENT_CHARACTER_VERSION,
        input: {
          prompt,
          subject: subjectUrl,
          number_of_outputs: 1,
          number_of_images_per_pose: 1,
          randomise_poses: false,
          output_format: 'webp',
          output_quality: 90,
          ...(seed !== undefined && { seed }),
        },
      }),
    })
  } catch (err) {
    throw new ImageGenerationError('Replicate consistent-character request failed', err)
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '(unreadable)')
    if (response.status === 401) {
      throw new ImageGenerationError('401: Invalid or missing Replicate API token')
    }
    if (response.status === 429 && attempt < 4) {
      const delay = Math.pow(2, attempt) * 3000 // 3s, 6s, 12s, 24s
      console.warn(`[replicate] 429 rate limit on attempt ${attempt + 1}, retrying in ${delay}ms`)
      await new Promise(r => setTimeout(r, delay))
      return callConsistentCharacter(apiKey, subjectUrl, pageImagePrompt, seed, attempt + 1)
    }
    throw new ImageGenerationError(`Replicate API error ${response.status}: ${errorText}`)
  }

  const data = await response.json() as {
    id: string
    status: string
    output?: string | string[]
  }

  let output: unknown = data.output

  if (data.status !== 'succeeded' || !output) {
    output = await waitForPrediction(apiKey, data.id)
  }

  const imageUrl = Array.isArray(output) ? output[0] : output
  if (typeof imageUrl !== 'string' || !imageUrl) {
    throw new ImageGenerationError('Consistent-character returned no image URL: ' + JSON.stringify(data))
  }

  return imageUrl
}
