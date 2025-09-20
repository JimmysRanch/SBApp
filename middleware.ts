import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

const PUBLIC_FILE = /\.(.*)$/;

const ROLE_ROUTES: Record<string, string[]> = {
  master: ['/', '/dashboard', '/calendar', '/clients', '/staff', '/employees', '/reports', '/messages', '/settings'],
  admin: ['/', '/dashboard', '/calendar', '/clients', '/staff', '/employees', '/reports', '/messages', '/settings'],
  senior_groomer: ['/', '/dashboard', '/calendar', '/clients', '/messages'],
  groomer: ['/', '/dashboard', '/calendar', '/clients', '/messages'],
  receptionist: ['/', '/dashboard', '/calendar', '/clients', '/messages'],
  client: ['/', '/client', '/client/appointments', '/client/profile'],
};

function isAllowedPath(role: string | null, path: string) {
  const allowed = ROLE_ROUTES[role];
  if (!allowed) return false;
  return allowed.some((base) => path === base || path.startsWith(`${base}/`));
}

export async function middleware(req: NextRequest) {
  if (PUBLIC_FILE.test(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const res = NextResponse.next({ request: { headers: req.headers } });
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  const cached = req.cookies.get('sb_role')?.value ?? null;
  let role = null;

  if (cached) {
    const [cachedRole, cachedUserId] = cached.split(':');
    if (cachedRole && cachedUserId === session.user.id) {
      role = cachedRole;
    }
  }

  if (!role) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    role = !error && data?.role ? data.role : 'client';
    res.cookies.set('sb_role', `${role}:${session.user.id}`, {
      maxAge: 300,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
  }

  const pathname = req.nextUrl.pathname;
  if (!isAllowedPath(role, pathname)) {
    const home = role === 'client' ? '/client' : '/dashboard';
    return NextResponse.redirect(new URL(home, req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next|favicon|assets|images|api/public|login|signup).*)'],
};
