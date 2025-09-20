import 'server-only';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient as createSupabaseJs, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

function readServiceRoleKey(): string | undefined {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function createClient() {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore }, {
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
  });
}

let cachedAdmin: SupabaseClient | null = null;
let cachedAdminKey: string | undefined;

export function getSupabaseAdmin(): SupabaseClient {
  const serviceKey = readServiceRoleKey();
  if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  if (cachedAdmin && cachedAdminKey === serviceKey) return cachedAdmin;
  cachedAdmin = createSupabaseJs(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  cachedAdminKey = serviceKey;
  return cachedAdmin;
}
