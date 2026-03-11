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
    tier: 1,
    name: 'Emerging',
    lexileRange: '100-300L',
    targetAge: 'Ages 3-4',
    wordsPerPage: '1-2 sentences, 5-8 words each',
    sentenceRules: 'Simple declarative. Subject-verb-object only.',
  },
  {
    tier: 2,
    name: 'Beginning',
    lexileRange: '300-500L',
    targetAge: 'Ages 5-6',
    wordsPerPage: '2-3 sentences, 8-12 words each',
    sentenceRules: 'Compound sentences ok. Common sight words.',
  },
  {
    tier: 3,
    name: 'Developing',
    lexileRange: '500-700L',
    targetAge: 'Ages 7-8',
    wordsPerPage: '3-4 sentences, 10-15 words each',
    sentenceRules: 'Varied structure. Some descriptive language.',
  },
  {
    tier: 4,
    name: 'Fluent',
    lexileRange: '700-900L',
    targetAge: 'Ages 9-10',
    wordsPerPage: '4-5 sentences, 12-18 words each',
    sentenceRules: 'Complex sentences. Richer vocabulary.',
  },
  {
    tier: 5,
    name: 'Advanced',
    lexileRange: '900-1100L',
    targetAge: 'Ages 11-12',
    wordsPerPage: '5-6 sentences, 15-20 words each',
    sentenceRules: 'Subordinate clauses. Literary devices.',
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
