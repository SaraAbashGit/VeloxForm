import type { User } from '@supabase/supabase-js';

// Two kinds of accounts share Supabase Auth: business owners (no role, the original accounts)
// and their customers, created with user_metadata.role = 'client'.
export function isClientUser(user: User | null | undefined): boolean {
  return user?.user_metadata?.role === 'client';
}

export function clientName(user: User | null | undefined): string {
  return (user?.user_metadata?.full_name as string | undefined) || user?.email || '';
}

/** Only internal paths may be used as a post-login destination (prevents open redirects) */
export function safeNext(next: unknown, fallback: string): string {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
