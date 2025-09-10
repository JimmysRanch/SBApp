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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <Image
        src="/login-bg.svg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="relative z-10 mb-8 text-center text-white">
        <Image
          src="/logo.svg"
          alt="Scruffy Butts logo"
          width={300}
          height={100}
          className="mx-auto mb-4 h-auto w-64"
          priority
        />
        <p className="mt-2 text-sm font-semibold uppercase tracking-wide">
          Dog Grooming
          <br />
          Natalia TX
        </p>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
