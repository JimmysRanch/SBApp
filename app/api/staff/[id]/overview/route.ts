import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const sid = params.id;
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: ok } = await supabase.rpc('has_perm', { _uid: uid, _perm: 'manage_staff' });
  if (!ok && uid !== sid) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const now = new Date();
  const d0 = new Date(now); d0.setHours(0,0,0,0);
  const d1 = new Date(now); d1.setHours(23,59,59,999);
  const w0 = new Date(now); const off = (now.getDay()+6)%7; w0.setDate(now.getDate()-off); w0.setHours(0,0,0,0);
  const w1 = new Date(w0); w1.setDate(w0.getDate()+6); w1.setHours(23,59,59,999);
  const m0 = new Date(now.getFullYear(), now.getMonth(), 1);
  const m1 = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59,999);

  async function k(a: Date, b: Date) {
    const { data } = await supabase.rpc('kpi_staff_window', { _sid: sid, _from: a.toISOString().slice(0,10), _to: b.toISOString().slice(0,10) });
    return { jobs: data?.jobs ?? 0, revenue: data?.revenue ?? 0, minutes: data?.minutes ?? 0 };
  }

  const { data: recent } = await supabase
    .from('appointments')
    .select('id,starts_at,ends_at,client_id,service_id,status,total_price')
    .eq('staff_id', sid).order('starts_at', { ascending: false }).limit(8);

  return NextResponse.json({ today: await k(d0,d1), week: await k(w0,w1), month: await k(m0,m1), recent: recent ?? [] });
}
