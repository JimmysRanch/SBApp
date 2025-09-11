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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-light via-primary to-primary-dark p-4">
        <LoginForm />
      </div>
    </Suspense>
  )
}
