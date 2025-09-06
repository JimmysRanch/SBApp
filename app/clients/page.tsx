"use client";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

 type Client = { id: string; full_name: string; phone: string | null; email: string | null };

export default function ClientsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("id, full_name, phone, email")
        .ilike("full_name", `%${q}%`)
        .order("full_name");
      if (!error && data) setRows(data);
      setLoading(false);
    };
    run();
  }, [q]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-4">Clients</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search clients…"
          className="border rounded px-3 py-2 mb-4 w-full max-w-md"
        />
        {loading ? <p>Loading…</p> : (
          <ul className="divide-y">
            {rows.map((c) => (
              <li key={c.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.full_name}</div>
                  <div className="text-sm text-gray-500">
                    {c.phone || "—"} · {c.email || "—"}
                  </div>
                </div>
                <Link className="text-blue-600 underline" href={`/clients/${c.id}`}>
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
