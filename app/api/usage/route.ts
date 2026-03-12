// app/api/usage/route.ts — GET: check free count, POST: increment counter

import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const maxDuration = 300

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session')

  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
    return NextResponse.json({ error: 'Missing session parameter' }, { status: 400 })
  }

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('usage')
      .select('count')
      .eq('session_id', sessionId)
      .maybeSingle()

    if (error) {
      console.error('[usage GET] Supabase error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const count = data?.count ?? 0
    const limit = 3

    return NextResponse.json({
      count,
      limit,
      byok_required: count >= limit,
    })
  } catch (err) {
    console.error('[usage GET] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { sessionId } = body as { sessionId?: string }

  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
    return NextResponse.json({ error: 'Missing sessionId in request body' }, { status: 400 })
  }

  try {
    const supabase = getSupabase()

    // Read current count first
    const { data: existing } = await supabase
      .from('usage')
      .select('count')
      .eq('session_id', sessionId)
      .maybeSingle()

    const currentCount = existing?.count ?? 0
    const newCount = currentCount + 1

    const { error } = await supabase
      .from('usage')
      .upsert(
        {
          session_id: sessionId,
          count: newCount,
          last_seen: new Date().toISOString(),
        },
        { onConflict: 'session_id' }
      )

    if (error) {
      console.error('[usage POST] Supabase upsert error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ count: newCount })
  } catch (err) {
    console.error('[usage POST] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
