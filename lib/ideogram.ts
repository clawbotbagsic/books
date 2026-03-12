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
  'Vintage Disney animation style, smooth hand-drawn lines, warm soft shading, 1950s Disney storybook illustration, rich saturated colors, expressive character faces, painterly backgrounds with soft focus depth, full scene composition, children\'s picture book'

export const NEGATIVE_PROMPT =
  'photorealistic, 3D render, CGI, dark, scary, violent, text, words, letters, watermark, signature, logo, blurry, low quality, anime, manga, pixel art, abstract'

export function buildImagePrompt(
  sceneDescription: string,
  characterDescription: string
): string {
  return `${ART_STYLE_ANCHOR}.\n\n${sceneDescription}\n\nCharacter details: ${characterDescription}\n\nConsistent character appearance across all pages — same face, same hair, same build, same outfit.`
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
          style_type: 'DESIGN',
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
