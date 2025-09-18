import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseJs, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function readServiceRoleKey() {
  const value = process.env['SUPABASE_SERVICE_ROLE_KEY']
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

let cachedAdmin: SupabaseClient | null = null
let cachedAdminKey: string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export function getSupabaseServiceRoleKey() {
  return readServiceRoleKey()
}

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) { return cookieStore.get(name)?.value },
      set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
      remove(name: string, options: CookieOptions) { cookieStore.delete({ name, ...options }) },
    },
  })
}

export function getSupabaseAdmin(): SupabaseClient {
  const serviceKey = readServiceRoleKey()
  if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  if (cachedAdmin && cachedAdminKey === serviceKey) return cachedAdmin
  cachedAdmin = createSupabaseJs(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  cachedAdminKey = serviceKey
  return cachedAdmin
}
