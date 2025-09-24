import Card from '@/components/Card';
import PageContainer from '@/components/PageContainer';
import { createClient } from '@/lib/supabase/server';

type Msg = {
  id: string;
  to_employee: string | null;
  from_name: string | null;
  body: string | null;
  created_at: string;
};

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('id, to_employee, from_name, body, created_at')
    .order('created_at', { ascending: false });

  const rows = (data ?? []) as Msg[];
  const err = error?.message ?? null;

  return (
    <PageContainer>
      <Card>
        <h1 className="mb-4 text-3xl font-bold text-primary-dark">Messages</h1>
        {err ? (
          <div className="rounded-2xl border border-red-300/40 bg-red-100/40 px-4 py-3 text-sm text-red-700">
            Failed to load messages: {err}
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((m) => (
              <li key={m.id} className="py-3">
                <div className="text-sm text-gray-500">
                  {new Date(m.created_at).toLocaleString()} — To {m.to_employee || '—'} from {m.from_name || '—'}
                </div>
                <div>{m.body}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageContainer>
  );
}
