// lib/bookSchema.ts — Zod validation for Claude story output

import { z } from 'zod'
import type { StoryJSON } from '../types/index'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export const StoryPageSchema = z.object({
  page_number: z.number().int().min(1).max(10),
  text: z.string().min(1, 'Page text must not be empty'),
  image_prompt: z.string().min(1, 'Image prompt must not be empty'),
})

export const StoryJSONSchema = z.object({
  character_description: z.string().min(1, 'Character description must not be empty'),
  pages: z
    .array(StoryPageSchema)
    .length(10, 'Story must have exactly 10 pages'),
})

export function validateStoryJSON(raw: unknown): StoryJSON {
  const result = StoryJSONSchema.safeParse(raw)
  if (!result.success) {
    throw new ValidationError(`Story validation failed: ${result.error.message}`)
  }

  const story = result.data

  // Verify page_numbers are exactly 1-10 in sequential order
  const pageNumbers = story.pages.map(p => p.page_number)
  for (let i = 0; i < 10; i++) {
    if (pageNumbers[i] !== i + 1) {
      throw new ValidationError(
        `Page numbers must be sequential 1-10. Got ${pageNumbers.join(', ')}`
      )
    }
  }

  return story as StoryJSON
}
