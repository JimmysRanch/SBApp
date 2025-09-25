import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const sid = params.id;
  const url = new URL(req.url);
  const from = url.searchParams.get('from') || undefined;
  const to = url.searchParams.get('to') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const page = Number(url.searchParams.get('page') || '1');
  const size = Number(url.searchParams.get('size') || '50');
  const offset = (page-1)*size;

  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: ok } = await supabase.rpc('has_perm', { _uid: uid, _perm: 'manage_staff' });
  if (!ok && uid !== sid) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let q = supabase.from('appointments').select('id,starts_at,ends_at,service_id,status,total_price,tip').eq('staff_id', sid);
  if (from) q = q.gte('starts_at', from);
  if (to) q = q.lte('starts_at', to);
  if (status && status !== 'all') q = q.eq('status', status);
  const { data, error } = await q.order('starts_at', { ascending: false }).range(offset, offset+size-1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: totals } = await supabase.rpc('history_totals', { _sid: sid, _from: from ?? null, _to: to ?? null, _status: status ?? null });
  return NextResponse.json({ rows: data ?? [], totals });
}
