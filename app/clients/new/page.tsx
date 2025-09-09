"use client";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";
import { supabase } from "@/lib/supabase/Client";
import { useRouter } from "next/navigation";

/**
 * Page to create a new client.  Presents a simple form with name,
 * phone and email fields and inserts the record into the `clients`
 * table on submit.
 */
export default function NewClientPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    // require full name
    if (!fullName.trim()) {
      setError("Name is required");
      setSaving(false);
      return;
    }
    const { error: insertError } = await supabase
      .from("clients")
      .insert({ full_name: fullName.trim(), phone: phone || null, email: email || null });
    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }
    router.push("/clients");
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 max-w-xl">
        <h1 className="text-2xl font-bold mb-4">Add New Client</h1>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Full Name</label>
            <input
              type="text"
              className="border rounded px-3 py-2 w-full"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Phone</label>
            <input
              type="tel"
              className="border rounded px-3 py-2 w-full"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              className="border rounded px-3 py-2 w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      </main>
    </div>
  );
}
