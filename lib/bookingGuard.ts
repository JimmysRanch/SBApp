import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
export async function canBook(staffId: string, startsAt: string, endsAt: string) {
  const { data, error } = await supabase.rpc('can_book', { _staff: staffId, _starts: startsAt, _ends: endsAt });
  if (error) throw error;
  return !!data;
}
