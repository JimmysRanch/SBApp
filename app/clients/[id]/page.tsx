// app/clients/[id]/page.tsx
'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Client = { id:number; full_name:string|null; email:string|null; phone:string|null; created_at:string };
type Pet    = { id:number; name:string|null; breed:string|null };
type Appt   = { id:number; start_time:string; end_time:string|null; status:string|null; price:number|null; service_id:number|null; service:string|null };

export default function ClientDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = Number(idParam);
  const router = useRouter();

  const [client,setClient] = useState<Client|null>(null);
  const [pets,setPets]     = useState<Pet[]>([]);
  const [appts,setAppts]   = useState<Appt[]>([]);
  const [err,setErr]       = useState<string|null>(null);
  const [loading,setLoading]=useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setErr(null);
      const [c1,p1,a1] = await Promise.all([
        supabase.from('clients')
          .select('id,full_name,email,phone,created_at')
          .eq('id', id).single(),
        supabase.from('pets')
          .select('id,name,breed')
          .eq('client_id', id)
          .order('id', { ascending:false }),
        supabase.from('appointments')
          .select('id,start_time,end_time,status,price,service_id,service')
          .eq('client_id', id)
          .order('start_time', { ascending:false })
          .limit(50),
      ]);
      if (cancelled) return;
      const error = c1.error || p1.error || a1.error;
      if (error) { setErr(error.message); setLoading(false); return; }
      setClient(c1.data); setPets(p1.data||[]); setAppts(a1.data||[]); setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div style={{ padding:16 }}>Loading…</div>;
  if (err)     return (
    <div style={{ padding:16, color:'#b00020' }}>
      Error: {err} <button onClick={()=>router.refresh()} style={{ marginLeft:8 }}>Retry</button>
    </div>
  );
  if (!client) return <div style={{ padding:16 }}>Not found.</div>;

  return (
    <div style={{ padding:16 }}>
      <div style={{ marginBottom:12 }}>
        <Link href="/clients">← Back to clients</Link>
      </div>

      <h1>{client.full_name || 'Client'}</h1>
      <p>
        <strong>Email:</strong> {client.email || '—'} &nbsp;|&nbsp;
        <strong>Phone:</strong> {client.phone || '—'}
      </p>
      <p><strong>Created:</strong> {new Date(client.created_at).toLocaleString()}</p>

      <h2>Pets</h2>
      {pets.length === 0 ? <div>None</div> : (
        <ul>
          {pets.map(p => <li key={p.id}>{p.name || '—'}{p.breed ? ` (${p.breed})` : ''}</li>)}
        </ul>
      )}

      <h2>Recent appointments</h2>
      {appts.length === 0 ? <div>None</div> : (
        <table cellPadding={8} style={{ borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ textAlign:'left', borderBottom:'1px solid #eee' }}>
              <th>Date</th><th>Status</th><th>Price</th><th>Service</th>
            </tr>
          </thead>
          <tbody>
            {appts.map(a => (
              <tr key={a.id} style={{ borderBottom:'1px solid #f3f3f3' }}>
                <td>{new Date(a.start_time).toLocaleString()}</td>
                <td>{a.status || '—'}</td>
                <td>{Number(a.price ?? 0).toFixed(2)}</td>
                <td>{a.service || a.service_id || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
