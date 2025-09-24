import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import { createClient } from "@/lib/supabase/server";

type MessageRow = {
  id: string;
  to_employee: string | null;
  from_name: string | null;
  body: string | null;
  created_at: string;
};

export const revalidate = 0;

export default async function MessagesPage() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("id, to_employee, from_name, body, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows: MessageRow[] = (data ?? []) as MessageRow[];

  return (
    <PageContainer>
      <Card>
        <h1 className="mb-4 text-3xl font-bold text-primary-dark">Messages</h1>
        {error && (
          <div className="mb-4 rounded-2xl border border-red-300/40 bg-red-100/40 px-4 py-3 text-sm text-red-700">
            Failed to load messages: {error.message}
          </div>
        )}
        {rows.length === 0 ? (
          <p className="py-6 text-sm text-brand-navy/70">No messages found.</p>
        ) : (
          <ul className="divide-y">
            {rows.map((m) => (
              <li key={m.id} className="py-3">
                <div className="text-sm text-gray-500">
                  {new Date(m.created_at).toLocaleString()} — To {m.to_employee || "—"} from {m.from_name || "—"}
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
