/**
 * scripts/upload-anchors.ts
 * One-time helper: uploads local ./anchors/*.webp files to Supabase Storage.
 *
 * Run:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx tsx scripts/upload-anchors.ts
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.SUPABASE_URL
const serviceKey  = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY env vars required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

const anchorsDir = path.resolve(process.cwd(), 'anchors')

async function main() {
  const files = fs.readdirSync(anchorsDir).filter((f: string) => f.endsWith('.webp'))
  const latest: Record<string, string> = {}
  for (const f of files) {
    const id = f.split('-')[0]
    if (!latest[id] || f > latest[id]) latest[id] = f
  }

  console.log('Uploading', Object.keys(latest).length, 'characters...\n')

  for (const [id, filename] of Object.entries(latest)) {
    const filePath = path.join(anchorsDir, filename)
    const buffer = fs.readFileSync(filePath)
    const storagePath = `characters/${id}.webp`

    const { error } = await supabase.storage
      .from('books')
      .upload(storagePath, buffer, { contentType: 'image/webp', upsert: true })

    if (error) {
      console.log(`  ${id}: ✗ ${error.message}`)
    } else {
      const { data } = supabase.storage.from('books').getPublicUrl(storagePath)
      console.log(`  ${id}: ✓ ${data.publicUrl}`)
    }
  }
}

main().catch(console.error)
