import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const sid = params.id;
  const url = new URL(req.url);
  const ps = url.searchParams.get('period_start');
  const pe = url.searchParams.get('period_end');

  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: ok } = await supabase.rpc('has_perm', { _uid: uid, _perm: 'manage_payroll' });
  if (!ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { data, error } = await supabase.rpc('payroll_calc', { _sid: sid, _from: ps, _to: pe });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? {});
}
