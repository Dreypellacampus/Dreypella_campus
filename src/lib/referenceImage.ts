import { getSupabase } from '@/lib/supabase';

const BUCKET = 'order-references';
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const SIGNED_URL_SECONDS = 300;

export function validateReferenceImage(file: File): string | null {
  if (!(file.type in EXTENSIONS)) return 'Please upload a JPEG, PNG or WebP image.';
  if (file.size > MAX_BYTES) return 'The image must be 5 MB or smaller.';
  return null;
}

export async function uploadReferenceImage(userId: string, reference: string, file: File): Promise<string> {
  const path = `${userId}/${reference}-${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
  const { error } = await getSupabase().storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new Error(`The reference image could not be uploaded. ${error.message}`);
  return path;
}

export async function createReferenceImageUrl(path: string): Promise<string> {
  const { data, error } = await getSupabase().storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error || !data) throw new Error(error?.message ?? 'The image link could not be created.');
  return data.signedUrl;
}
