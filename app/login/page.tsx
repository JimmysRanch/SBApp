import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from '@/components/LoginForm'

export default async function LoginPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-400 to-blue-800">
      <div className="mb-8 text-center text-white">
        <h1 className="text-5xl font-extrabold drop-shadow">Scruffy Butts</h1>
        <p className="mt-2 text-sm font-semibold uppercase tracking-wide">
          Dog Grooming
          <br />
          Natalia TX
        </p>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 rounded-t-[50%] bg-pink-400 -z-10" />
    </div>
  )
}
