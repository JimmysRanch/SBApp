"use client";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

// Type definition for a client record
type Client = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
};

/**
 * Clients list page.  Displays a search box, a list of existing clients,
 * and a button to add a new client.  Selecting a client navigates to
 * their detail page (not yet implemented in this project skeleton).
 */
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
      if (!error && data) setRows(data as Client[]);
      setLoading(false);
    };
    run();
  }, [q]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 pb-20 md:p-8">
        <h1 className="text-2xl font-bold mb-4">Clients</h1>
        {/* Button to navigate to the new client form */}
        <div className="mb-4">
          <Link
            href="/clients/new"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Client
          </Link>
        </div>
        {/* Search input */}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search clients…"
          className="border rounded px-3 py-2 mb-4 w-full max-w-md"
        />
        {/* List or loading indicator */}
        {loading ? (
          <p>Loading…</p>
        ) : (
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
