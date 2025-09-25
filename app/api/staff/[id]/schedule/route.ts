import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const sid = params.id;
  const url = new URL(req.url);
  const from = url.searchParams.get('from')!;
  const to = url.searchParams.get('to')!;

  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: canView } = await supabase.rpc('has_perm', { _uid: uid, _perm: 'manage_hours' });
  if (!canView && uid !== sid) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { data: shifts } = await supabase.from('shifts')
    .select('id,starts_at,ends_at,note').eq('staff_id', sid)
    .gte('starts_at', from).lte('starts_at', to).order('starts_at', { ascending: true });

  const { data: timeoff } = await supabase.from('time_off')
    .select('id,starts_at,ends_at,reason,status').eq('staff_id', sid)
    .gte('starts_at', from).lte('starts_at', to).order('starts_at', { ascending: true });

  return NextResponse.json({ shifts: shifts ?? [], time_off: timeoff ?? [] });
}
