import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Supabase URL and anon key fallback to provided values if env vars are not set.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tzbybtluhzntfhjexptw.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6YnlidGx1aHpudGZoamV4cHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTkxNzIsImV4cCI6MjA3MTk5NTE3Mn0.E-2Y9CupjktT67UwkCP3Bm7-cBDmkolk2RIo_sPyRHQ";

/**
 * Create a Supabase client instance configured for server-side usage.
 *
 * The cookie handlers passed to `createServerClient` must conform to the
 * Next.js API where `cookieStore.delete` accepts a single options object
 * containing the cookie name.  A previous implementation passed the name and
 * options as separate arguments which caused a TypeScript error during the
 * Vercel build.  The `remove` helper now merges the name with the options
 * before delegating to `cookieStore.delete`.
 *
 * An optional `cookieStore` parameter is exposed for testability, allowing
 * callers to inject a mock implementation when needed.
 */
export function createClient(
  cookieStore: ReturnType<typeof cookies> = cookies(),
  serverClient = createServerClient,
) {
  return serverClient(
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
        remove(name: string, options: CookieOptions) {
          // Combine the name and options into a single argument to satisfy the
          // Next.js cookie API.
          cookieStore.delete({ name, ...options });
        },
      },
    },
  );
}
