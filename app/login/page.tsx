// app/login/page.tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const search = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      return
    }
    const next = search.get('redirect') ?? '/dashboard'
    router.replace(next)
  }

  /* render form … */
}
