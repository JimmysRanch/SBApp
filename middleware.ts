// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = ['/dashboard', '/book', '/clients', '/appointments'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // If user tries to access a protected route without Supabase cookies, send to /login
  if (PROTECTED.some(p => pathname.startsWith(p))) {
    const hasAccess = req.cookies.has('sb-access-token') && req.cookies.has('sb-refresh-token');
    if (!hasAccess) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/book/:path*', '/clients/:path*', '/appointments/:path*'],
};
