import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Supabase URL and anon key fallback to provided values if env vars are not set.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tzbybtluhzntfhjexptw.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6YnlidGx1aHpudGZoamV4cHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTkxNzIsImV4cCI6MjA3MTk5NTE3Mn0.E-2Y9CupjktT67UwkCP3Bm7-cBDmkolk2RIo_sPyRHQ";

/**
 * Create a Supabase client instance configured for server-side usage.
 *
 * This helper wraps `createServerClient` from `@supabase/ssr` and provides
 * cookie management functions compatible with Next.js. The remove
 * function calls `cookieStore.delete(name)` without passing options
 * because the Next.js cookie API expects either a string key or an
 * options object, but not both. Omitting the options resolves a type error
 * seen during the Vercel build.
 */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Spread options into the second parameter to satisfy the type
          // signature for cookieStore.set().
          cookieStore.set(name, value, { ...options });
        },
        remove(name: string, _options: CookieOptions) {
          // Next.js cookieStore.delete accepts only a single parameter. Passing
          // options caused a type error during build, so we ignore the
          // provided options and simply delete by name.
          cookieStore.delete(name);
        },
      },
    },
  );
}
