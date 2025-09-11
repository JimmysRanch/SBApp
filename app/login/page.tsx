import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from '@/components/LoginForm'

export default async function LoginPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')
  return (
    <Suspense fallback={null}>
      <div
        className="flex min-h-screen items-center justify-center bg-cover bg-center p-4"
        style={{ backgroundImage: "url('/login-background.svg')" }}
      >
        <LoginForm />
      </div>
    </Suspense>
  )
}
