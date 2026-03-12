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
  page_number: z.number().int().min(1).max(32),
  text: z.string().min(1, 'Page text must not be empty'),
  image_prompt: z.string().min(1, 'Image prompt must not be empty'),
})

// Base schema — page count validated separately based on tier's targetPages
export const StoryJSONSchema = z.object({
  character_description: z.string().min(1, 'Character description must not be empty'),
  pages: z
    .array(StoryPageSchema)
    .min(10, 'Story must have at least 10 pages')
    .max(32, 'Story must have at most 32 pages'),
})

export function validateStoryJSON(raw: unknown, expectedPages?: number): StoryJSON {
  const result = StoryJSONSchema.safeParse(raw)
  if (!result.success) {
    throw new ValidationError(`Story validation failed: ${result.error.message}`)
  }

  const story = result.data
  const n = story.pages.length

  // If caller specifies expected page count, enforce it (with ±2 tolerance for Claude variance)
  if (expectedPages !== undefined) {
    const tolerance = 2
    if (Math.abs(n - expectedPages) > tolerance) {
      throw new ValidationError(
        `Story has ${n} pages but expected ~${expectedPages} (±${tolerance}) for this tier`
      )
    }
  }

  // Verify page_numbers are sequential 1-N
  const pageNumbers = story.pages.map(p => p.page_number)
  for (let i = 0; i < n; i++) {
    if (pageNumbers[i] !== i + 1) {
      throw new ValidationError(
        `Page numbers must be sequential 1-${n}. Got ${pageNumbers.join(', ')}`
      )
    }
  }

  return story as StoryJSON
}
