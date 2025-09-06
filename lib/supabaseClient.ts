import { createClient } from '@supabase/supabase-js'

// In a real app these values should come from environment variables.
// They are referenced here so the code compiles during development. At runtime
// Next.js will inject values from .env.local via NEXT_PUBLIC_SUPABASE_URL and
// NEXT_PUBLIC_SUPABASE_ANON_KEY. Users must provide their own values.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)