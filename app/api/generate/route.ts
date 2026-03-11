// app/api/generate/route.ts — POST: full book generation orchestration
// Pass 1: Claude story generation → Pass 2: Ideogram image generation (fire-and-forget)

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateStory } from '@/lib/anthropic'
import { callIdeogram, buildImagePrompt } from '@/lib/ideogram'
import { uploadImage } from '@/lib/storage'
import { getTierByNumber } from '@/lib/lexile'
import { getSupabase } from '@/lib/supabase'

export const maxDuration = 300

const RequestSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  childName: z.string().min(1).max(30, 'Child name must be 30 characters or less'),
  age: z.number().int().min(3).max(12),
  tier: z.number().int().min(1).max(5),
  theme: z.string().min(1).max(100, 'Theme must be 100 characters or less'),
  pronouns: z.enum(['he/him', 'she/her', 'they/them']),
  sidekick: z.string().max(50, 'Sidekick must be 50 characters or less').optional(),
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

  const { sessionId, childName, age, tier: tierNumber, theme, pronouns, sidekick } = parsed.data

  // Server-side free tier enforcement and BYOK gate
  const supabaseForUsage = getSupabase()
  const { data: usageData } = await supabaseForUsage
    .from('usage')
    .select('count')
    .eq('session_id', sessionId)
    .maybeSingle()

  const currentCount = usageData?.count ?? 0

  const byokAnthropicKey = request.headers.get('x-anthropic-key')
  const byokIdeogramKey = request.headers.get('x-ideogram-key')

  let anthropicKey: string
  let ideogramKey: string
  let usingByok: boolean

  if (currentCount >= 3) {
    // BYOK required — both keys must be present
    if (!byokAnthropicKey || !byokIdeogramKey) {
      return NextResponse.json(
        { error: 'Both Anthropic and Ideogram API keys are required after 3 free books. Please add your keys in Settings.' },
        { status: 402 }
      )
    }
    anthropicKey = byokAnthropicKey
    ideogramKey = byokIdeogramKey
    usingByok = true
  } else {
    // Free tier — use env vars, ignore any BYOK headers
    anthropicKey = process.env.ANTHROPIC_API_KEY ?? ''
    ideogramKey = process.env.IDEOGRAM_API_KEY ?? ''
    usingByok = false
  }

  if (!anthropicKey) {
    return NextResponse.json({ error: 'No Anthropic API key available' }, { status: 401 })
  }
  if (!ideogramKey) {
    return NextResponse.json({ error: 'No Ideogram API key available' }, { status: 401 })
  }

  // Resolve Lexile tier object
  let tierObj
  try {
    tierObj = getTierByNumber(tierNumber)
  } catch (err) {
    return NextResponse.json({ error: `Invalid tier: ${tierNumber}` }, { status: 400 })
  }

  const bookInput = { sessionId, childName, age, tier: tierNumber as 1 | 2 | 3 | 4 | 5, theme, pronouns, sidekick }

  // ── PASS 1: Story Generation ──────────────────────────────────────────────
  let storyJSON
  try {
    storyJSON = await generateStory(anthropicKey, bookInput, tierObj)
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
  generateImages(supabase, bookUuid, storyJSON, ideogramKey, usingByok).catch(err => {
    console.error('[generate] Background image generation failed:', err)
  })

  // Return UUID immediately — client polls /api/book/[uuid] for progress
  return NextResponse.json({ uuid: bookUuid, status: 'generating' })
}

// ── Background image generation ───────────────────────────────────────────────
// Runs after the HTTP response is sent. Updates the book record in Supabase
// after each page so the polling client sees live progress.
async function generateImages(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  bookUuid: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  storyJSON: any,
  ideogramKey: string,
  usingByok: boolean
): Promise<void> {
  const imageUrls: (string | null)[] = new Array(storyJSON.pages.length).fill(null)

  for (let i = 0; i < storyJSON.pages.length; i++) {
    const page = storyJSON.pages[i]
    const prompt = buildImagePrompt(storyJSON.character_description, page.image_prompt)

    let ideogramUrl: string
    try {
      ideogramUrl = await callIdeogram(ideogramKey, prompt)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[generate] Ideogram failed for page ${page.page_number}:`, err)

      if (message.includes('401') || message.includes('Unauthorized') || message.includes('Invalid API key')) {
        await supabase
          .from('books')
          .update({ status: 'failed' })
          .eq('uuid', bookUuid)
        return
      }

      // Non-fatal: skip this image, keep going
      console.warn(`[generate] Skipping page ${page.page_number} image due to error`)
      continue
    }

    // Upload to Supabase Storage
    let publicUrl: string
    try {
      publicUrl = await uploadImage(ideogramUrl, bookUuid, page.page_number)
    } catch (err) {
      console.error(`[generate] Storage upload failed for page ${page.page_number}:`, err)
      continue
    }

    imageUrls[i] = publicUrl

    // Update the book record after each image so poller sees live progress
    try {
      await supabase
        .from('books')
        .update({
          image_urls: imageUrls,
          pages_complete: imageUrls.filter(Boolean).length,
        })
        .eq('uuid', bookUuid)
    } catch (err) {
      console.error(`[generate] Failed to update book after page ${page.page_number}:`, err)
    }
  }

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
