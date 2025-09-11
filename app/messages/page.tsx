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
      <Card>
        <h1 className="mb-4 text-3xl font-bold text-primary-dark">Messages</h1>
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
      </Card>
    </PageContainer>
  );
}
