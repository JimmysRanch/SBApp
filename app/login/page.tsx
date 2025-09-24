export const runtime = 'nodejs';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LoginForm from '@/components/LoginForm';

export default async function LoginPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/');
  }

  return (
    <div className="relative flex min-h-[calc(100vh-6rem)] w-full items-center justify-center px-4 pb-16 pt-12">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-white/15 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-brand-bubble/20 blur-[200px]" />
      </div>
      <LoginForm />
    </div>
  );
}
