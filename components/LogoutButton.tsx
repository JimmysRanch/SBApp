'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LogoutButton({ className = '' }: { className?: string }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <button
      onClick={handleSignOut}
      className={`w-full rounded bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300 ${className}`}
    >
      Log out
    </button>
  );
}
