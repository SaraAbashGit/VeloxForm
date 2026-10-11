import { randomUUID } from 'crypto';
import { createServiceClient } from '@/lib/supabase/admin';

// All buckets are private. Answers store a reference "<bucket>/<path>" (never a public URL);
// the dashboard turns it into a short-lived signed URL after checking the viewer owns the form.

export const UPLOAD_MAX_SIZE = 10_000_000; // matches the "uploads" bucket limit
export const UPLOAD_ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

// Files are uploaded by the browser straight to storage (Vercel limits request bodies to 4.5MB)
const PENDING_PREFIX = 'pending/';

export interface StoredFile {
  name: string;
  ref: string;
}

export async function uploadSignature(dataUrl: string, submissionId: string, fieldId: string): Promise<string> {
  if (!dataUrl.startsWith('data:image/png;base64,')) throw new Error('Invalid signature');
  const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
  const path = `${submissionId}/${fieldId}.png`;

  const { error } = await createServiceClient()
    .storage.from('signatures')
    .upload(path, buffer, { contentType: 'image/png', upsert: true });

  if (error) throw new Error(error.message);
  return `signatures/${path}`;
}

export async function uploadPdf(buffer: Buffer, submissionId: string): Promise<string> {
  const path = `${submissionId}.pdf`;
  const { error } = await createServiceClient()
    .storage.from('pdfs')
    .upload(path, buffer, { contentType: 'application/pdf', upsert: true });

  if (error) throw new Error(error.message);
  return `pdfs/${path}`;
}

/** One-time upload slot for a public form file; validation happens here, before anything is stored */
export async function createUploadTarget(fileName: string, type: string, size: number) {
  if (!UPLOAD_ALLOWED_TYPES.includes(type)) throw new Error('סוג קובץ לא נתמך');
  if (size <= 0 || size > UPLOAD_MAX_SIZE) throw new Error('הקובץ גדול מדי');

  const ext = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const path = `${PENDING_PREFIX}${randomUUID()}.${ext}`;

  const { data, error } = await createServiceClient().storage.from('uploads').createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message ?? 'Upload failed');
  return { path, token: data.token };
}

/** Validates a file answer sent by the browser and returns what we store in submission_answers */
export async function confirmUpload(rawValue: string): Promise<string> {
  const parsed = JSON.parse(rawValue) as { name?: unknown; path?: unknown };
  const path = typeof parsed.path === 'string' ? parsed.path : '';
  // Only accept files that went through createUploadTarget
  if (!/^pending\/[0-9a-f-]{36}\.[a-z0-9]+$/.test(path)) throw new Error('Invalid file reference');

  const folder = createServiceClient().storage.from('uploads');
  const { data } = await folder.list('pending', { search: path.slice(PENDING_PREFIX.length) });
  if (!data?.length) throw new Error('File was not uploaded');

  const name = typeof parsed.name === 'string' ? parsed.name.slice(0, 200) : 'קובץ מצורף';
  const stored: StoredFile = { name, ref: `uploads/${path}` };
  return JSON.stringify(stored);
}

export function parseStoredFile(value: string): StoredFile | null {
  try {
    const parsed = JSON.parse(value) as Partial<StoredFile>;
    return typeof parsed.ref === 'string' ? { name: parsed.name ?? 'קובץ מצורף', ref: parsed.ref } : null;
  } catch {
    return null;
  }
}

/** Caller must have verified that the current user owns the form this file belongs to */
export async function getSignedUrl(ref: string, download?: string): Promise<string | null> {
  const [bucket, ...rest] = ref.split('/');
  if (!['signatures', 'uploads', 'pdfs'].includes(bucket) || rest.length === 0) return null;

  const { data } = await createServiceClient()
    .storage.from(bucket)
    .createSignedUrl(rest.join('/'), 60 * 60, download ? { download } : undefined);
  return data?.signedUrl ?? null;
}
