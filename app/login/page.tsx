import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import LoginForm from '@/components/LoginForm'

export default async function LoginPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-200 via-pink-200 to-pink-400 p-4">
      <div className="flex items-center gap-6 mb-8">
        <div className="flex flex-col items-center justify-center rounded-full bg-blue-500 px-6 py-8 text-white shadow-lg">
          <h1 className="text-4xl font-extrabold leading-tight text-center">
            Scruffy
            <br />
            Butts
          </h1>
          <p className="mt-2 text-sm uppercase tracking-wide">Dog Grooming</p>
        </div>
        <Image
          src="https://images.dog.ceo/breeds/poodle-miniature/n02113712_1403.jpg"
          alt="Happy dog"
          width={160}
          height={160}
          className="w-40 h-40 object-cover"
        />
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
