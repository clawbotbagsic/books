// lib/lexile.ts — Core IP: 5-tier Lexile system

import type { LexileTier } from '../types/index'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export const LEXILE_TIERS: LexileTier[] = [
  {
    // Board book / Pre-reader — ages 3-4. Even simpler than Tier 2.
    tier: 1,
    name: 'Pre-Reader',
    lexileRange: 'BR-100L',
    targetAge: 'Ages 3-4',
    targetPages: 12,
    pageRange: '10-14 pages',
    wordsPerPage: '1-2 sentences, 3-6 words each',
    totalWordRange: '30-80 words total',
    sentenceRules: 'Subject-verb only. 80-90% one-syllable words. HIGH repetition — same pattern repeats with one word swap.',
  },
  {
    // Early Reader / F&P Level A-C — ages 5-6, benchmark: Landon.
    // Target: ~14 pages, ~80 words, ~6 words/page.
    tier: 2,
    name: 'Early Reader',
    lexileRange: '100-300L',
    targetAge: 'Ages 5-6',
    targetPages: 14,
    pageRange: '12-16 pages',
    wordsPerPage: '1-2 sentences, 3-10 words each',
    totalWordRange: '50-150 words total',
    sentenceRules: 'Dolch/Fry sight words dominate. CVC words. 80-90% one-syllable words. Repetitive sentence patterns. No multi-syllable words except character names. Simple present tense.',
  },
  {
    // Developing Reader / F&P Level D-I — ages 7-8, benchmark: Baylor.
    // Target: ~20 pages, ~300 words, ~15 words/page.
    tier: 3,
    name: 'Developing Reader',
    lexileRange: '300-500L',
    targetAge: 'Ages 7-8',
    targetPages: 20,
    pageRange: '16-24 pages',
    wordsPerPage: '2-4 sentences, 10-25 words each',
    totalWordRange: '200-500 words total',
    sentenceRules: 'Common blends and two-syllable words OK. 65-75% one-syllable words. Dialogue encouraged. Past tense and contractions OK. One "stretch" word per spread max.',
  },
  {
    // Fluent Reader — ages 9-10. Chapter book bridge.
    tier: 4,
    name: 'Fluent Reader',
    lexileRange: '500-700L',
    targetAge: 'Ages 9-10',
    targetPages: 28,
    pageRange: '24-32 pages',
    wordsPerPage: '3-5 sentences, 20-50 words each',
    totalWordRange: '500-1,200 words total',
    sentenceRules: 'Varied sentence structures. Descriptive adjectives and adverbs. Grade-appropriate vocabulary (curious, discover, enormous). Clear cause-and-effect.',
  },
  {
    // Parent Read-Aloud / Advanced — ages 11-12 or parent reading to younger child.
    // Benchmark: Peter Rabbit range (27 pages, ~36 words/page, 969 words).
    tier: 5,
    name: 'Advanced',
    lexileRange: '700-900L',
    targetAge: 'Ages 11-12',
    targetPages: 32,
    pageRange: '28-32 pages',
    wordsPerPage: '4-6 sentences, 30-70 words each',
    totalWordRange: '800-2,000 words total',
    sentenceRules: 'Rich vocabulary. Complex sentence structures. Multi-syllable words fine. Internal character thoughts. Subordinate clauses and literary devices welcome.',
  },
]

// Maps age 3-12 to tier number 1-5
const AGE_TIER_MAP: Record<number, 1 | 2 | 3 | 4 | 5> = {
  3: 1, 4: 1,
  5: 2, 6: 2,
  7: 3, 8: 3,
  9: 4, 10: 4,
  11: 5, 12: 5,
}

export function getDefaultTier(age: number): LexileTier {
  const tierNum = AGE_TIER_MAP[age]
  if (!tierNum) throw new ValidationError(`Age ${age} is out of supported range 3-12`)
  return LEXILE_TIERS[tierNum - 1]
}

export function nudgeTier(currentTier: number, direction: 1 | -1): number {
  const next = currentTier + direction
  // Clamp to 1-5
  return Math.max(1, Math.min(5, next))
}

export function getTierByNumber(tier: number): LexileTier {
  if (tier < 1 || tier > 5) throw new ValidationError(`Tier ${tier} out of range 1-5`)
  return LEXILE_TIERS[tier - 1]
}
