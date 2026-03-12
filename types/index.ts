// types/index.ts — Shared TypeScript types for Inklings

export type ReadMode = 'aloud' | 'independent'

export type ThemeKey =
  | 'lost-in-the-jungle'
  | 'space-mission'
  | 'dragon-who-was-different'
  | 'great-ocean-voyage'
  | 'forbidden-door'
  | 'enchanted-forest'
  | 'everyday-hero'
  | 'unexpected-friend'
  | 'wishing-star'
  | 'before-the-storm'

export interface BookFormInput {
  sessionId:  string
  childName:  string           // max 30 chars
  age:        number           // 3-8 (Phase 1); 9-12 Phase 2+
  tier:       1 | 2 | 3 | 4 | 5
  theme:      string           // one of the 10 ThemeKey values (Phase 1)
  readMode?:  ReadMode         // optional — defaults to 'aloud' if omitted
  pronouns:   'he/him' | 'she/her' | 'they/them'
  sidekick?:  string           // optional companion character, max 50 chars
}

export interface LexileTier {
  tier:               1 | 2 | 3 | 4 | 5
  name:               string           // e.g. "Developing"
  lexileRange:        string           // e.g. "500-700L"
  targetAge:          string           // e.g. "Ages 7-8"
  targetPages:        number           // e.g. 20 — target page count for this tier
  pageRange:          string           // e.g. "16-24 pages" — shown in prompt
  wordsPerPage:       string           // e.g. "10-25 words, 2-4 sentences"
  totalWordRange:     string           // e.g. "200-500 words total"
  sentenceRules:      string           // e.g. "Varied structure. Some descriptive language."
}

export interface StoryPage {
  page_number:   number        // 1-N (varies by tier, max 32)
  text:          string        // story text for this page
  image_prompt:  string        // raw image prompt from Claude (character description appended separately)
}

export interface StoryJSON {
  character_description:  string       // shared visual description appended to all image prompts
  pages:                  StoryPage[]  // length varies by tier (12-32 pages)
}

export interface BookRecord {
  uuid:            string
  status:          'generating' | 'complete' | 'failed'
  pages_complete:  number          // 0-10
  childName:       string
  tier:            number
  theme:           string
  pages: {
    page_number:  number
    text:         string
    image_url:    string | null    // null until that page's image is uploaded
  }[]
  createdAt:       string          // ISO 8601
  expiresAt:       string          // ISO 8601 — createdAt + 30 days
}

export interface UsageResponse {
  count:          number
  limit:          3
  byok_required:  boolean
}
