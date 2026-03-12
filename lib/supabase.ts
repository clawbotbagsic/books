// lib/supabase.ts — Server-side Supabase client using service role key
import { createClient, SupabaseClient } from '@supabase/supabase-js'

function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL
  if (!url) throw new Error('SUPABASE_URL environment variable is not set')
  return url
}

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set')
  return key
}

export function getSupabase(): SupabaseClient {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      // Next.js patches globalThis.fetch to enable its Data Cache.
      // Supabase uses that patched fetch internally, so all PostgREST reads
      // get cached across requests unless we explicitly opt out here.
      fetch: (url: RequestInfo | URL, init?: RequestInit) =>
        fetch(url, { ...init, cache: 'no-store' }),
    },
  })
}