"use client";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Msg = {
  id: string;
  to_employee: string | null;
  from_name: string | null;
  body: string | null;
  created_at: string;
};

export default function MessagesPage() {
  const [rows, setRows] = useState<Msg[]>([]);
  useEffect(() => {
    supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows(data || []);
      });
  }, []);
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
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
      </main>
    </div>
  );
}
