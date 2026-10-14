import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { businessStatus, isAdminUser, isClientUser } from '@/lib/auth/roles';

// Business-owner pages. /forms/<slug> alone is the public form and stays open.
function isBusinessArea(path: string) {
  return (
    path.startsWith('/dashboard') ||
    path.startsWith('/profile') ||
    path.startsWith('/submissions') ||
    path.startsWith('/clients') ||
    path.startsWith('/admin') ||
    path.startsWith('/share') ||
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
    if (!user) {
      const login = new URL('/login', request.url);
      if (path.startsWith('/admin')) login.searchParams.set('next', path);
      return NextResponse.redirect(login);
    }
    // Customers have their own area and never see the business dashboard
    if (isClientUser(user)) return NextResponse.redirect(new URL('/my', request.url));
    // The platform admin screen is for the platform owner only
    if (path.startsWith('/admin') && !isAdminUser(user)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // A self-registered business can't work until the platform owner approves it
    if (!isAdminUser(user) && businessStatus(user) !== 'approved') {
      return NextResponse.redirect(new URL('/pending-approval', request.url));
    }
  }

  if (!user && path.startsWith('/my')) {
    return NextResponse.redirect(new URL('/client/login?next=/my', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/submissions/:path*', '/clients/:path*', '/forms/:path*', '/my/:path*', '/admin/:path*', '/share/:path*'],
};
