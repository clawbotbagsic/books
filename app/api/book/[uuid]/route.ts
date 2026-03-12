// app/api/book/[uuid]/route.ts — GET: fetch book record for reader/polling

import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import type { BookRecord } from '@/types/index'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface RouteParams {
  params: { uuid: string }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { uuid } = params

  if (!uuid || typeof uuid !== 'string') {
    return NextResponse.json({ error: 'Missing book UUID' }, { status: 400 })
  }

  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('uuid', uuid)
      .maybeSingle()

    if (error) {
      console.error('[book GET] Supabase error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Check expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This book has expired. Create a new one!' },
        { status: 410 }
      )
    }

    // Build the BookRecord response shape
    // story_json is typed as Record<string, unknown> in our Database type — we need to access it
    const storyJson = data.story_json as {
      character_description: string
      pages: Array<{ page_number: number; text: string; image_prompt: string }>
    } | null

    const storyPages = storyJson?.pages ?? []
    const imageUrls: (string | null)[] = Array.isArray(data.image_urls) ? data.image_urls : []

    const pages = storyPages.map((page, index: number) => ({
      page_number: page.page_number,
      text: page.text,
      image_url: imageUrls[index] ?? null,
    }))

    const bookRecord: BookRecord = {
      uuid: data.uuid,
      status: data.status,
      pages_complete: data.pages_complete ?? 0,
      childName: data.child_name,
      tier: data.tier,
      theme: data.theme,
      pages,
      createdAt: data.created_at,
      expiresAt: data.expires_at ?? '',
    }

    return NextResponse.json(bookRecord)
  } catch (err) {
    console.error('[book GET] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
