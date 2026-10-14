import type { User } from '@supabase/supabase-js';

// Two kinds of accounts share Supabase Auth: business owners (no role, the original accounts)
// and their customers, created with user_metadata.role = 'client'.
export function isClientUser(user: User | null | undefined): boolean {
  return user?.user_metadata?.role === 'client';
}

// The platform owner. Not a secret, so it has a default and can be overridden from the environment.
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '022532477a@gmail.com').toLowerCase();

export function isAdminUser(user: User | null | undefined): boolean {
  return !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL;
}

export type BusinessStatus = 'pending' | 'approved' | 'rejected';

// Stored in app_metadata, which only the service role can write. Self-registered businesses start as
// 'pending'; accounts created before approvals existed have no status and count as approved.
export function businessStatus(user: User | null | undefined): BusinessStatus {
  const status = user?.app_metadata?.business_status;
  return status === 'pending' || status === 'rejected' ? status : 'approved';
}

export function clientName(user: User | null | undefined): string {
  return (user?.user_metadata?.full_name as string | undefined) || user?.email || '';
}

/** Only internal paths may be used as a post-login destination (prevents open redirects) */
export function safeNext(next: unknown, fallback: string): string {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
