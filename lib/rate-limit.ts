import { headers } from 'next/headers';

// Basic fixed-window rate limiting (spec: "Rate limiting בסיסי").
// In-memory, so each server instance counts separately: enough to stop floods and scripts,
// not a hard global quota. Move to a shared store (e.g. Upstash/Redis) if that is ever needed.
const hits = new Map<string, { count: number; resetAt: number }>();

function clientIp(): string {
  const h = headers();
  return h.get('x-forwarded-for')?.split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
}

/** Returns true when the caller is over the limit. `key` names the action; the caller's IP is added. */
export function isRateLimited(key: string, limit: number, windowMs: number, identity: string = clientIp()): boolean {
  const now = Date.now();
  const bucketKey = `${key}:${identity}`;
  const entry = hits.get(bucketKey);

  if (!entry || entry.resetAt <= now) {
    hits.set(bucketKey, { count: 1, resetAt: now + windowMs });
    if (hits.size > 10_000) {
      // Drop expired entries so the map cannot grow without bound
      hits.forEach((value, k) => {
        if (value.resetAt <= now) hits.delete(k);
      });
    }
    return false;
  }

  entry.count += 1;
  return entry.count > limit;
}

export const RATE_LIMIT_MESSAGE = 'יותר מדי ניסיונות בזמן קצר. נסו שוב בעוד כמה דקות';

const MINUTE = 60_000;
export const LIMITS = {
  submitForm: { limit: 10, windowMs: 10 * MINUTE },
  uploadFile: { limit: 30, windowMs: 10 * MINUTE },
  explainForm: { limit: 20, windowMs: 10 * MINUTE },
  generateForm: { limit: 20, windowMs: 60 * MINUTE },
  analyzeSubmissions: { limit: 10, windowMs: 60 * MINUTE },
  signIn: { limit: 10, windowMs: 10 * MINUTE },
  signUp: { limit: 5, windowMs: 60 * MINUTE },
} as const;
