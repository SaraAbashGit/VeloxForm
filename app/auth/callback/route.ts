import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Target of the links in Supabase emails (verify email, reset password): turns the one-time code into a session
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  // Only allow internal paths, so the link cannot be abused to redirect elsewhere
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
