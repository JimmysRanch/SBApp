// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => { res.cookies.set({ name, value, ...(options || {}) }); },
        remove: (name, options) => { res.cookies.set({ name, value: '', ...(options || {}) }); },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;

  const isAuthPath = path === '/login';
  const isStatic =
    path.startsWith('/_next/') ||
    path.startsWith('/icons/') ||
    path === '/favicon.ico' ||
    path === '/manifest.webmanifest';

  if (!user && !isAuthPath && !isStatic) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPath) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return res;
}

// ✅ Simple, valid matcher (no negative lookaheads)
export const config = {
  matcher: ['/((?!_next/|icons/|favicon.ico|manifest.webmanifest|login).*)'],
};
