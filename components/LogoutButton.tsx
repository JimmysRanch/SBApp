'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login'); // send back to login
  };

  return (
    <button onClick={onLogout} className={className}>
      Log out
    </button>
  );
}
