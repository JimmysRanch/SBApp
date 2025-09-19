"use client";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

// Message record type.  Adjust fields to match your Supabase schema.
interface Msg {
  id: string;
  to_employee: string | null;
  from_name: string | null;
  body: string | null;
  created_at: string;
}

/**
 * Messages page lists recent messages from the `messages` table.  This
 * could later be expanded to allow replying or filtering by employee.
 */
export default function MessagesPage() {
  const [rows, setRows] = useState<Msg[]>([]);

  useEffect(() => {
    supabase
      .from("messages")
      .select("id, to_employee, from_name, body, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows((data || []) as Msg[]);
      });
  }, []);

  return (
    <PageContainer>
      <Card className="space-y-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Inbox</p>
          <h1 className="text-3xl font-semibold text-brand-charcoal">Messages</h1>
          <p className="text-sm text-slate-500">Latest updates from clients and teammates land here.</p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-200">
            {rows.map((m) => (
              <li key={m.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>{new Date(m.created_at).toLocaleString()}</span>
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-slate-300" />
                  <span>To {m.to_employee || '—'} from {m.from_name || '—'}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{m.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </PageContainer>
  );
}
