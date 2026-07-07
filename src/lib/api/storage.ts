// Storage access for the private `attachments` bucket.
// Paths use fixed prefixes that the storage RLS policies key on:
//   milestone-proofs/  (manager writes)
//   comment-images/    (any authenticated user)
//   documents/         (manager writes)
// The bucket is private, so every read goes through a signed URL.

import { supabase } from '@/lib/supabase';

export type AttachmentPrefix = 'milestone-proofs' | 'comment-images' | 'documents';

const BUCKET = 'attachments';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // refreshed on every refetch, so 1h is plenty

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
}

/** Uploads a file and returns its storage path (store this in the DB). */
export async function uploadAttachment(prefix: AttachmentPrefix, file: File): Promise<string> {
  const path = `${prefix}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return path;
}

/**
 * Resolves storage paths to signed URLs in one batch call.
 * Returns a map keyed by path; missing/failed paths are simply absent.
 */
export async function createSignedUrls(paths: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(unique, SIGNED_URL_TTL_SECONDS);
  if (error) {
    console.error('Failed to sign storage URLs:', error.message);
    return map;
  }
  for (const item of data ?? []) {
    if (item.path && item.signedUrl && !item.error) {
      map.set(item.path, item.signedUrl);
    }
  }
  return map;
}
