// app/api/generate/route.ts — POST: full book generation orchestration
// Pass 1: Claude story generation → Pass 2: Replicate image generation (fire-and-forget)

import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { z } from 'zod'
import { generateStory } from '@/lib/anthropic'
import { callConsistentCharacter } from '@/lib/replicate'
import { uploadImage } from '@/lib/storage'
import { getTierByNumber } from '@/lib/lexile'
import { getSupabase } from '@/lib/supabase'
import { themeContainsProfanity, storyContainsProfanity } from '@/lib/profanity'
import { getCharacter } from '@/lib/characters'

export const maxDuration = 300

const RequestSchema = z.object({
  sessionId:   z.string().min(1, 'sessionId is required'),
  characterId: z.string().min(1, 'characterId is required'),
  childName:   z.string().min(1).max(30, 'Child name must be 30 characters or less'),
  age:         z.number().int().min(3).max(8),
  tier:        z.number().int().min(1).max(3),
  theme:       z.string().min(1).max(100, 'Theme must be 100 characters or less'),
  readMode:    z.enum(['aloud', 'independent']).optional().default('aloud'),
  pronouns:    z.enum(['he/him', 'she/her', 'they/them']),
  sidekick:    z.string().max(50, 'Sidekick must be 50 characters or less').optional(),
})

export async function POST(request: NextRequest) {
  // Parse and validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { sessionId, characterId, childName, age, tier: tierNumber, theme, readMode, pronouns, sidekick } = parsed.data

  // Validate character exists
  const character = getCharacter(characterId)
  if (!character) {
    return NextResponse.json({ error: `Unknown character: ${characterId}` }, { status: 400 })
  }

  // ── Input gate: profanity check on user-supplied theme ────────────────────
  try {
    const themeFlagged = await themeContainsProfanity(theme)
    if (themeFlagged) {
      return NextResponse.json(
        { error: 'The theme you entered isn\'t appropriate for a kids\' book. Please try a different adventure!' },
        { status: 400 }
      )
    }
  } catch {
    // Fail open — don't block if the filter API is down
    console.warn('[generate] Profanity input check failed (continuing)')
  }

  // Server-side free tier enforcement and BYOK gate
  const supabaseForUsage = getSupabase()
  const { data: usageData } = await supabaseForUsage
    .from('usage')
    .select('count')
    .eq('session_id', sessionId)
    .maybeSingle()

  const currentCount = usageData?.count ?? 0

  const byokAnthropicKey = request.headers.get('x-anthropic-key')
  const byokReplicateKey = request.headers.get('x-replicate-key')

  let anthropicKey: string
  let replicateKey: string
  let usingByok: boolean

  if (currentCount >= 3) {
    // BYOK required — both keys must be present
    if (!byokAnthropicKey || !byokReplicateKey) {
      return NextResponse.json(
        { error: 'Both Anthropic and Replicate API keys are required after 3 free books. Please add your keys in Settings.' },
        { status: 402 }
      )
    }
    anthropicKey = byokAnthropicKey
    replicateKey = byokReplicateKey
    usingByok = true
  } else {
    // Free tier — use env vars, ignore any BYOK headers
    anthropicKey = process.env.ANTHROPIC_API_KEY ?? ''
    replicateKey = process.env.REPLICATE_API_TOKEN ?? ''
    usingByok = false
  }

  if (!anthropicKey) {
    return NextResponse.json({ error: 'No Anthropic API key available' }, { status: 401 })
  }
  if (!replicateKey) {
    return NextResponse.json({ error: 'No Replicate API token available' }, { status: 401 })
  }

  // Resolve Lexile tier object
  let tierObj
  try {
    tierObj = getTierByNumber(tierNumber)
  } catch (err) {
    return NextResponse.json({ error: `Invalid tier: ${tierNumber}` }, { status: 400 })
  }

  const bookInput = { sessionId, characterId, childName, age, tier: tierNumber as 1 | 2 | 3 | 4 | 5, theme, readMode: parsed.data.readMode ?? 'aloud', pronouns, sidekick }

  // ── PASS 1: Story Generation ──────────────────────────────────────────────
  let storyJSON
  try {
    storyJSON = await generateStory(anthropicKey, bookInput, tierObj, character.storyDescription)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[generate] Story generation failed:', err)

    if (message.includes('authentication') || message.includes('401') || message.includes('Invalid API key')) {
      return NextResponse.json(
        {
          error: 'Your Anthropic API key is invalid or expired. Please check your key in Settings.',
          failedKey: 'anthropic',
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Story generation failed after 2 attempts. Please try again.' },
      { status: 422 }
    )
  }

  // ── Output gate: profanity check on generated story text ─────────────────
  try {
    const storyFlagged = await storyContainsProfanity(storyJSON)
    if (storyFlagged) {
      console.warn('[generate] Profanity detected in generated story — blocking save')
      return NextResponse.json(
        { error: 'The generated story contained inappropriate content. Please try again with a different theme.' },
        { status: 422 }
      )
    }
  } catch {
    // Fail open — don't block if the filter API is down
    console.warn('[generate] Profanity output check failed (continuing)')
  }

  const supabase = getSupabase()
  const bookUuid = crypto.randomUUID()

  // Increment usage counter (triggers on Pass 1 success per spec)
  try {
    const { data: usageRow } = await supabase
      .from('usage')
      .select('count')
      .eq('session_id', sessionId)
      .maybeSingle()

    const newCount = (usageRow?.count ?? 0) + 1
    await supabase
      .from('usage')
      .upsert(
        { session_id: sessionId, count: newCount, last_seen: new Date().toISOString() },
        { onConflict: 'session_id' }
      )
  } catch (err) {
    // Non-fatal — don't block generation over a counter failure
    console.error('[generate] Usage increment failed:', err)
  }

  // Insert book record in Supabase (expires_at is GENERATED ALWAYS AS column — do not insert it)
  try {
    const { error: insertError } = await supabase.from('books').insert({
      uuid: bookUuid,
      session_id: sessionId,
      child_name: childName,
      tier: tierNumber,
      theme,
      pronouns,
      story_json: storyJSON,
      image_urls: [],
      pages_complete: 0,
      status: 'generating',
    })

    if (insertError) {
      console.error('[generate] Book insert failed:', insertError)
      return NextResponse.json({ error: 'Failed to create book record' }, { status: 500 })
    }
  } catch (err) {
    console.error('[generate] Book insert exception:', err)
    return NextResponse.json({ error: 'Failed to create book record' }, { status: 500 })
  }

  // Log story generation cost (non-fatal, fire-and-forget)
  void (async () => {
    try {
      await supabase.from('cost_log').insert({
        book_uuid: bookUuid,
        event_type: 'story_generation',
        used_byok: usingByok,
      })
    } catch { /* non-fatal */ }
  })()

  // ── PASS 2: Image Generation — fire-and-forget so client gets UUID immediately ──
console.log('[generate] Starting background image generation for', bookUuid)
waitUntil(
  generateImages(supabase, bookUuid, storyJSON, replicateKey, usingByok, character.anchorUrl)
    .then(() => console.log('[generate] Image generation complete for', bookUuid))
    .catch(err => console.error('[generate] Background image generation failed:', err))
)
// Return UUID immediately — client polls /api/book/[uuid] for progress
return NextResponse.json({ uuid: bookUuid, status: 'generating' })
}
// ── Background image generation ───────────────────────────────────────────────
// Runs after the HTTP response is sent.
//
// Phase 1: Generate character anchor image from character_description (1 call)
// Phase 2: Generate per-page illustrations using anchor as subject reference
//
// sdxl-based/consistent-character has ~10 concurrent prediction limit per account.
// Batch of 5 avoids hitting it — 3 batches × ~25s = ~75s total, well within limits.
const IMAGE_BATCH_SIZE = 5

async function generateImages(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  bookUuid: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  storyJSON: any,
  replicateKey: string,
  usingByok: boolean,
  anchorUrl: string   // pre-made character anchor — no Phase 1 needed
): Promise<void> {
  const imageUrls: (string | null)[] = new Array(storyJSON.pages.length).fill(null)
  let authFailed = false

  // Fix seed per book so art style is consistent across all pages
  const bookSeed = Math.floor(Math.random() * 2_147_483_647)

  console.log('[generate] Using pre-made anchor for', bookUuid, '→', anchorUrl)

  // ── Phase 2: Per-page generation ───────────────────────────────────────────
  for (let batchStart = 0; batchStart < storyJSON.pages.length; batchStart += IMAGE_BATCH_SIZE) {
    if (authFailed) break

    const batchEnd = Math.min(batchStart + IMAGE_BATCH_SIZE, storyJSON.pages.length)
    const batch = storyJSON.pages.slice(batchStart, batchEnd)

    const promises = batch.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (page: any, batchIndex: number) =>
        (async () => {
          const i = batchStart + batchIndex
          if (authFailed) return

          let replicateUrl: string
          try {
            replicateUrl = await callConsistentCharacter(
              replicateKey,
              anchorUrl,
              page.image_prompt,
              bookSeed
            )
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            console.error(`[generate] Replicate failed for page ${page.page_number}:`, err)

            if (message.includes('401')) {
              authFailed = true
              await supabase
                .from('books')
                .update({ status: 'failed' })
                .eq('uuid', bookUuid)
            }
            return
          }

          // Upload to Supabase Storage
          let publicUrl: string
          try {
            publicUrl = await uploadImage(replicateUrl, bookUuid, page.page_number)
          } catch (err) {
            console.error(`[generate] Storage upload failed for page ${page.page_number}:`, err)
            return
          }

          imageUrls[i] = publicUrl

          // Update the book record so poller sees live progress
          try {
            await supabase
              .from('books')
              .update({
                image_urls: [...imageUrls],
                pages_complete: imageUrls.filter(Boolean).length,
              })
              .eq('uuid', bookUuid)
          } catch (err) {
            console.error(`[generate] Failed to update book after page ${page.page_number}:`, err)
          }
        })()
    )

    await Promise.allSettled(promises)
  }

  if (authFailed) return

  // Mark book complete
  try {
    await supabase
      .from('books')
      .update({
        status: 'complete',
        completed_at: new Date().toISOString(),
        image_urls: imageUrls,
        pages_complete: imageUrls.filter(Boolean).length,
      })
      .eq('uuid', bookUuid)
  } catch (err) {
    console.error('[generate] Failed to mark book complete:', err)
  }

  // Log image generation cost (non-fatal)
  try {
    await supabase.from('cost_log').insert({
      book_uuid: bookUuid,
      event_type: 'image_generation',
      image_count: imageUrls.filter(Boolean).length,
      used_byok: usingByok,
    })
  } catch { /* non-fatal */ }
}
