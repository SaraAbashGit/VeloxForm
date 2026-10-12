import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isClientUser } from '@/lib/auth/roles';

// Business-owner pages. /forms/<slug> alone is the public form and stays open.
function isBusinessArea(path: string) {
  return (
    path.startsWith('/dashboard') ||
    path.startsWith('/profile') ||
    path.startsWith('/submissions') ||
    path.startsWith('/clients') ||
    path === '/forms' ||
    path === '/forms/new' ||
    /^\/forms\/[^/]+\/(edit|submissions)(\/|$)/.test(path)
  );
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (isBusinessArea(path)) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url));
    // Customers have their own area and never see the business dashboard
    if (isClientUser(user)) return NextResponse.redirect(new URL('/my', request.url));
  }

  if (!user && path.startsWith('/my')) {
    return NextResponse.redirect(new URL('/client/login?next=/my', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/submissions/:path*', '/clients/:path*', '/forms/:path*', '/my/:path*'],
};
