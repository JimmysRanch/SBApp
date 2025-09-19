'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useSearchParams } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const sp = useSearchParams();
  const redirectTo = sp.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    window.location.href = redirectTo;
  }

  return (
    <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', padding:24 }}>
      <form onSubmit={login} style={{ width:360, maxWidth:'90vw', padding:24, border:'1px solid #eee', borderRadius:8, background:'#fff' }}>
        <h1 style={{ marginBottom: 16 }}>Sign in</h1>
        {err && <div style={{ color:'#b00020', marginBottom:12 }}>Error: {err}</div>}
        <div style={{ display:'grid', gap:8 }}>
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required style={{ padding:10, border:'1px solid #ccc', borderRadius:4 }} />
          <input type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} required style={{ padding:10, border:'1px solid #ccc', borderRadius:4 }} />
          <button type="submit" disabled={loading} style={{ padding:'10px 12px' }}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </div>
      </form>
    </div>
  );
}
