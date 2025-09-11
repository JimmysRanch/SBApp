import { Suspense } from 'react'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from '@/components/LoginForm'

export default async function LoginPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <Image
        src="https://images.unsplash.com/photo-1495799356653-e618eb2625de?auto=format&fit=crop&w=1567&q=80"
        alt="Neon background"
        fill
        priority
        className="object-cover"
        unoptimized
      />
      <div className="relative z-10">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
