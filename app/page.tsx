import { redirect } from 'next/navigation'

export default function Home() {
  // In the real app you would check auth state and redirect accordingly.
  redirect('/dashboard')
  return null
}