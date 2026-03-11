// lib/supabase.ts — Server-side Supabase client using service role key
// This client bypasses Row Level Security. Only use in API routes, never in browser code.

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

// Singleton pattern — reuse across requests in the same serverless instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: SupabaseClient<any> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabase(): SupabaseClient<any> {
  if (!_supabase) {
    _supabase = createClient(getSupabaseUrl(), getServiceRoleKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return _supabase
}
