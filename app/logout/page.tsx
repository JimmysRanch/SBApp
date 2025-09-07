"use client";
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LogoutPage() {
  useEffect(() => {
    (async () => {
      await supabase.auth.signOut();
      window.location.href = "/login";
    })();
  }, []);

  return <p className="p-6">Signing you out…</p>;
}
