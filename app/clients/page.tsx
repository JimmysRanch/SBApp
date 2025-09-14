"use client";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
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
  const [selected, setSelected] = useState<Client | null>(null);

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
    <PageContainer>
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="space-y-4 md:col-span-2">
          <h1 className="text-3xl font-bold text-primary-dark">Clients</h1>
          <div>
            <Link
              href="/clients/new"
              className="inline-block rounded-full bg-primary px-4 py-2 text-white shadow hover:bg-primary-dark"
            >
              Add Client
            </Link>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search clients…"
            className="mb-4 w-full max-w-md rounded-full border border-gray-300 px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary-light"
          />
          {loading ? (
            <p>Loading…</p>
          ) : (
            <ul className="divide-y">
              {rows.map((c) => (
                <li
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="relative flex cursor-pointer items-center justify-between py-3"
                >
                  <div>
                    <div className="font-medium">{c.full_name}</div>
                    <div className="text-sm text-gray-500">
                      {c.phone || "—"} · {c.email || "—"}
                    </div>
                  </div>
                  {selected?.id === c.id && (
                    <Link
                      href={`/clients/${c.id}`}
                      className="absolute inset-0 flex items-center justify-center bg-primary/80 text-lg font-semibold text-white"
                    >
                      Client Page
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="md:col-start-3">
          {selected ? (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-primary-dark">Quick View</h2>
              <p className="font-medium">{selected.full_name}</p>
              <p className="text-sm text-gray-600">
                Phone: {selected.phone || "—"}
              </p>
              <p className="text-sm text-gray-600">
                Email: {selected.email || "—"}
              </p>
            </div>
          ) : (
            <>
              <h2 className="mb-4 text-lg font-semibold text-primary-dark">Client Details</h2>
              <p className="text-sm text-gray-600">Select a client to view details.</p>
            </>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
