// lib/storage.ts — Supabase Storage helpers for book images
// All uploads use the server-side service role client.

import { getSupabase } from './supabase'

export class StorageError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'StorageError'
  }
}

const BUCKET_NAME = 'books'

/**
 * Downloads an image from a URL (e.g. Ideogram CDN) and uploads it to
 * Supabase Storage at books/<bookUuid>/page-<pageNumber>.jpg.
 * Returns the public URL of the stored image.
 */
export async function uploadImage(
  imageUrl: string,
  bookUuid: string,
  pageNumber: number
): Promise<string> {
  // Fetch the image bytes from the source URL
  let imageResponse: Response
  try {
    imageResponse = await fetch(imageUrl)
  } catch (err) {
    throw new StorageError(`Failed to fetch image from ${imageUrl}`, err)
  }

  if (!imageResponse.ok) {
    throw new StorageError(
      `Image fetch returned ${imageResponse.status} for URL: ${imageUrl}`
    )
  }

  let imageBuffer: ArrayBuffer
  try {
    imageBuffer = await imageResponse.arrayBuffer()
  } catch (err) {
    throw new StorageError('Failed to read image response body', err)
  }

  const storagePath = `books/${bookUuid}/page-${pageNumber}.jpg`
  const supabase = getSupabase()

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (uploadError) {
    throw new StorageError(`Supabase Storage upload failed: ${uploadError.message}`, uploadError)
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath)

  if (!urlData?.publicUrl) {
    throw new StorageError(`Could not retrieve public URL for path: ${storagePath}`)
  }

  return urlData.publicUrl
}
