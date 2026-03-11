// types/index.ts — Shared TypeScript types for Story Spark

export interface BookFormInput {
  sessionId:  string
  childName:  string           // max 30 chars
  age:        number           // 3-12
  tier:       1 | 2 | 3 | 4 | 5
  theme:      string           // max 100 chars
  pronouns:   'he/him' | 'she/her' | 'they/them'
  sidekick?:  string           // optional companion character, max 50 chars e.g. "a golden retriever named Biscuit"
}

export interface LexileTier {
  tier:               1 | 2 | 3 | 4 | 5
  name:               string           // e.g. "Developing"
  lexileRange:        string           // e.g. "500-700L"
  targetAge:          string           // e.g. "Ages 7-8"
  wordsPerPage:       string           // e.g. "3-4 sentences, 10-15 words each"
  sentenceRules:      string           // e.g. "Varied structure. Some descriptive language."
}

export interface StoryPage {
  page_number:   number        // 1-10
  text:          string        // story text for this page
  image_prompt:  string        // raw image prompt from Claude (character description appended separately)
}

export interface StoryJSON {
  character_description:  string       // shared visual description appended to all image prompts
  pages:                  StoryPage[]  // exactly 10 items
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
