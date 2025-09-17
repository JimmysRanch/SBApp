export const runtime = "nodejs";
// app/page.tsx
import { createClient } from '@/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  redirect(user ? '/dashboard' : '/login')
}

