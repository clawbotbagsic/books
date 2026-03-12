// lib/ideogram.ts — Ideogram image generation wrapper

export class ImageGenerationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'ImageGenerationError'
  }
}

interface IdeogramImage {
  url: string
  prompt?: string
  resolution?: string
  is_image_safe?: boolean
  seed?: number
}

interface IdeogramResponse {
  created?: string
  data: IdeogramImage[]
}

export function getIdeogramKey(req: Request): string {
  const key = req.headers.get('x-ideogram-key') ?? process.env.IDEOGRAM_API_KEY
  if (!key) throw new ImageGenerationError('No Ideogram API key available')
  return key
}

export const ART_STYLE_ANCHOR =
  'Digital illustration, warm saturated colors, soft diffused lighting, children\'s picture book style, Studio Ghibli-inspired watercolor textures, slightly rounded character proportions, expressive faces, rich environmental detail, full scene composition'

export const SIGNATURE_OUTFIT =
  'The child hero wears a bright red hoodie with a small gold star on the chest, dark blue jeans, and blue sneakers with white soles.'

export const NEGATIVE_PROMPT =
  'photorealistic, 3D render, dark, scary, violent, text, words, letters, watermark, signature, logo, blurry, low quality'

export function buildCharacterAnchor(childAge: number): string {
  return `The child hero is a Chinese boy, approximately ${childAge} years old, slim build, short straight black hair, warm brown eyes, round friendly face, light skin. ${SIGNATURE_OUTFIT} Consistent character throughout — same face, same hair, same build, same outfit on every page.`
}

export function buildImagePrompt(
  sceneDescription: string,
  characterDescription: string,
  childAge: number
): string {
  const characterAnchor = buildCharacterAnchor(childAge)
  return `${ART_STYLE_ANCHOR}.\n\n${sceneDescription}\n\n${characterAnchor}\n\n${characterDescription}`
}

export async function callIdeogram(
  apiKey: string,
  prompt: string
): Promise<string> {
  let response: Response
  try {
    response = await fetch('https://api.ideogram.ai/generate', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_request: {
          prompt,
          negative_prompt: NEGATIVE_PROMPT,
          aspect_ratio: 'ASPECT_4_3',
          model: 'V_2',
          style_type: 'CHILDRENS_BOOK',
          magic_prompt_option: 'OFF',
        },
      }),
    })
  } catch (err) {
    throw new ImageGenerationError('Ideogram API network request failed', err)
  }

  if (!response.ok) {
    let errorText = ''
    try {
      errorText = await response.text()
    } catch {
      errorText = '(could not read error body)'
    }
    throw new ImageGenerationError(`Ideogram API error ${response.status}: ${errorText}`)
  }

  let data: IdeogramResponse
  try {
    data = await response.json() as IdeogramResponse
  } catch (err) {
    throw new ImageGenerationError('Ideogram response was not valid JSON', err)
  }

  const imageUrl = data?.data?.[0]?.url
  if (!imageUrl) {
    throw new ImageGenerationError('Ideogram response missing image URL: ' + JSON.stringify(data))
  }
  return imageUrl
}
