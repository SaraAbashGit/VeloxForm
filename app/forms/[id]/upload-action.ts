'use server';

import { isRateLimited, LIMITS, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit';
import { createUploadTarget } from '@/lib/storage';

type UploadTargetResult = { ok: true; path: string; token: string } | { ok: false; error: string };

// Called by the public form before uploading a file straight to storage
export async function requestUploadUrl(fileName: string, type: string, size: number): Promise<UploadTargetResult> {
  const { limit, windowMs } = LIMITS.uploadFile;
  if (isRateLimited('requestUploadUrl', limit, windowMs)) return { ok: false, error: RATE_LIMIT_MESSAGE };

  try {
    return { ok: true, ...(await createUploadTarget(fileName, type, size)) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'שגיאה בהעלאת הקובץ' };
  }
}
