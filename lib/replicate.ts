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
  "vintage Disney-style cartoon illustration, smooth hand-drawn lines, warm shading, 1940s-1950s Disney animation style, expressive character design, warm cream background"

const REPLICATE_API_BASE = 'https://api.replicate.com/v1'

// fofr/consistent-character — FLUX IP-Adapter, same tech as Neolemon V3
// $0.039/run, open source: github.com/fofr/cog-consistent-character
// Community model: must use POST /v1/predictions with version in body (not /models/ endpoint)
const CONSISTENT_CHARACTER_VERSION =
  '9c77a3c2f884193fcee4d89645f02a0b9def9434f9e03cb98460456b831c8772'

// FLUX Dev for anchor generation — higher quality than Schnell, better linework
// Used to produce the character reference illustration before per-page generation
// Cost: ~$0.025/run vs Schnell's ~$0.003 — worth it since anchor drives all 14 pages
const FLUX_DEV_MODEL = 'black-forest-labs/flux-dev'

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

// CDC 50th-percentile growth data (NHANES) — used to anchor image model proportions
// Image models ignore written ages; visual proportion cues are required instead.
// Heights: boys age 3=38in, 4=41in, 5=44in, 6=46in, 7=48in, 8=51in
//          girls approx 1in shorter at each age
const CDC_PROPORTIONS: Record<number, { height: string; build: string; face: string }> = {
  3: { height: '3 feet 2 inches tall (very small toddler)', build: 'very chubby arms and legs, round pot belly, tiny hands and feet', face: 'very large round head (1/4 of total height), huge chubby cheeks, small button nose, wide eyes low on face, very short neck' },
  4: { height: '3 feet 5 inches tall (small preschooler)', build: 'chubby arms and legs, round belly, small hands', face: 'large round head, chubby cheeks, small nose, wide eyes, short neck' },
  5: { height: '3 feet 8 inches tall (kindergartner)', build: 'slightly chubby arms, rounded belly, small hands', face: 'large round head (head is large relative to body), chubby cheeks, small nose, wide-set eyes' },
  6: { height: '3 feet 10 inches tall (first grader)', build: 'lean but still with baby fat, small hands', face: 'round head still large relative to body, full cheeks, small features' },
  7: { height: '4 feet tall exactly (second grader)', build: 'lean, starting to lose baby fat, small hands', face: 'round face, head still proportionally large, slightly slimmer cheeks than younger' },
  8: { height: '4 feet 3 inches tall (third grader)', build: 'lean, small but athletic build, small hands', face: 'round face, large head relative to body, cheeks starting to slim slightly' },
}

function ageProportions(age: number): string {
  const p = CDC_PROPORTIONS[Math.min(Math.max(age, 3), 8)]
  return `${p.height}. Body: ${p.build}. Face and head: ${p.face}. This is a YOUNG CHILD not a teenager — very short stature, large head-to-body ratio, clearly a small kid.`
}

export function buildAnchorPrompt(characterDescription: string, age: number): string {
  const proportions = ageProportions(age)
  return `${ART_STYLE_PREFIX}. Character reference sheet showing front view, 3/4 view, and side view of the same character, plus facial expressions (happy, surprised, sad) in the top right corner. ${characterDescription}. ${proportions}. Full body visible in each view, arms at sides, hands visible, plain cream background. Classic Disney character sheet layout.`
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
  characterDescription: string,
  age: number
): Promise<string> {
  const prompt = buildAnchorPrompt(characterDescription, age)

  let response: Response
  try {
    response = await fetch(`${REPLICATE_API_BASE}/models/${FLUX_DEV_MODEL}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Prefer: 'wait', // synchronous response if supported; falls back to polling
      },
      body: JSON.stringify({
        input: {
          prompt,
          num_inference_steps: 28,
          guidance: 3.5,
          aspect_ratio: '1:1',
          output_format: 'webp',
          output_quality: 90,
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
