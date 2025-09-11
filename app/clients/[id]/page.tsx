"use client";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";

type Client = { id: string; full_name: string; phone: string | null; email: string | null; notes: string | null };
type Pet = { id: string; name: string; breed: string | null; photo_url: string | null; notes: string | null };
type Appt = { id: string; start_time: string; service: string | null; status: string; price: number | null };

export default function ClientDetail({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<Client | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [visits, setVisits] = useState<Appt[]>([]);
  const [tab, setTab] = useState<"overview" | "pets" | "history" | "billing">("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const [{ data: c }, { data: p }, { data: a }] = await Promise.all([
        supabase.from("clients").select("*").eq("id", params.id).single(),
        supabase.from("pets").select("*").eq("client_id", params.id),
        supabase
          .from("appointments")
          .select("id,start_time,service,status,price")
          .eq("client_id", params.id)
          .order("start_time", { ascending: false })
          .limit(25),
      ]);
      if (c) setClient(c as Client);
      if (p) setPets(p as any);
      if (a) setVisits(a as any);
      setLoading(false);
    };
    run();
  }, [params.id]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        {loading && <p>Loading…</p>}
        {!loading && client && (
          <>
            <h1 className="text-2xl font-bold mb-2">{client.full_name}</h1>
            <div className="text-gray-600 mb-6">
              {client.phone || "—"} · {client.email || "—"}
            </div>
            <div className="flex gap-3 mb-6">
              {(["overview", "pets", "history", "billing"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`px-3 py-2 rounded ${tab === k ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                >
                  {k[0].toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
            {tab === "overview" && (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded shadow">
                  <h3 className="font-semibold mb-2">Next appointment</h3>
                  <p className="text-sm">
                    {visits.length ? new Date(visits[0].start_time).toLocaleString() : "None"}
                  </p>
                </div>
                <div className="p-4 bg-white rounded shadow md:col-span-2">
                  <h3 className="font-semibold mb-2">Last 3 visits</h3>
                  <ul className="text-sm divide-y">
                    {visits.slice(0, 3).map((v) => (
                      <li key={v.id} className="py-2 flex justify-between">
                        <span>
                          {new Date(v.start_time).toLocaleDateString()} — {v.service || "Service"}
                        </span>
                        <span className="text-gray-600">{v.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {tab === "pets" && (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {pets.map((p) => (
                  <div key={p.id} className="p-4 bg-white rounded shadow">
                    <div className="relative w-full h-40 bg-gray-100 mb-3 overflow-hidden rounded">
                      {p.photo_url ? (
                        <Image src={p.photo_url} alt={p.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-sm text-gray-600">{p.breed || "—"}</div>
                  </div>
                ))}
              </div>
            )}
            {tab === "history" && (
              <div className="bg-white rounded shadow">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="p-3">Date</th>
                      <th>Service</th>
                      <th>Status</th>
                      <th className="text-right pr-3">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map((v) => (
                      <tr key={v.id} className="border-b">
                        <td className="p-3">{new Date(v.start_time).toLocaleDateString()}</td>
                        <td>{v.service || "—"}</td>
                        <td>{v.status}</td>
                        <td className="text-right pr-3">${Number(v.price || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {tab === "billing" && <ClientBilling clientId={client.id} />}
          </>
        )}
      </main>
    </div>
  );
}

function ClientBilling({ clientId }: { clientId: string }) {
  const [amount, setAmount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase
        .from("payments")
        .select("amount")
        .eq("client_id", clientId);
      setTotal((data || []).reduce((s, p) => s + Number(p.amount || 0), 0));
    };
    run();
  }, [clientId]);

  return (
    <div className="p-4 bg-white rounded shadow max-w-xl">
      <div className="font-semibold mb-2">Payments</div>
      <div className="mb-3 text-sm text-gray-600">Lifetime paid: ${total.toFixed(2)}</div>
      <div className="flex gap-2 items-center">
        <input
          type="number"
          className="border rounded px-3 py-2"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <button
          className="px-3 py-2 bg-blue-600 text-white rounded"
          onClick={async () => {
            await supabase.from("payments").insert({ client_id: clientId, amount });
            setAmount(0);
            const { data } = await supabase
              .from("payments")
              .select("amount")
              .eq("client_id", clientId);
            setTotal((data || []).reduce((s, p) => s + Number(p.amount || 0), 0));
          }}
        >
          Record payment
        </button>
      </div>
    </div>
  );
}
