"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Admin = {
  email: string;
  user_id: string;
};

export default function SettingsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [newAdmin, setNewAdmin] = useState("");

  // ---------------- LOAD FUNCTION ----------------
  async function load() {
    setLoading(true);
    setErr(null);

    const { data: ures, error: uerr } = await supabase.auth.getUser();
    if (uerr || !ures.user) {
      setErr(uerr?.message ?? "Not logged in");
      setLoading(false);
      return;
    }
    const user = ures.user;

    setEmail(user.email ?? null);

    const { data: emp } = await supabase
      .from("employees")
      .select("name")
      .eq("user_id", user.id)
      .maybeSingle();
    setName(emp?.name ?? null);

    const { data: isAdminData, error: iaErr } = await supabase.rpc("is_admin");
    const iAmAdmin = !!(isAdminData === true && !iaErr);
    setIsAdmin(iAmAdmin);

    if (iAmAdmin) {
      const { data: list, error: lerr } = await supabase.rpc("admin_list");
      if (!lerr && Array.isArray(list)) setAdmins(list as any);
      else setAdmins([]);
    } else {
      setAdmins([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // ---------------- ACTIONS ----------------
  async function addAdmin() {
    if (!newAdmin) return;
    const { error } = await supabase.rpc("add_admin_by_email", {
      email_input: newAdmin,
    });
    if (error) setErr(error.message);
    setNewAdmin("");
    load();
  }

  async function removeAdmin(user_id: string) {
    const { error } = await supabase.rpc("remove_admin", { uid: user_id });
    if (error) setErr(error.message);
    load();
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  // ---------------- RENDER ----------------
  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-500">Error: {err}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div>
        <p>
          <strong>Logged in as:</strong> {name ?? email}
        </p>
        <p>
          <strong>Role:</strong>{" "}
          {isAdmin ? "Owner / Admin" : "Employee (limited)"}
        </p>
      </div>

      <button
        onClick={logout}
        className="px-4 py-2 bg-red-600 text-white rounded"
      >
        Log out
      </button>

      {isAdmin && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold">Admin management</h2>
          <div className="flex space-x-2 mt-2">
            <input
              type="email"
              value={newAdmin}
              onChange={(e) => setNewAdmin(e.target.value)}
              placeholder="Add admin by email"
              className="border p-2 flex-1"
            />
            <button
              onClick={addAdmin}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Add
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {admins.length === 0 && (
              <li className="text-gray-500">No admins listed.</li>
            )}
            {admins.map((a) => (
              <li key={a.user_id} className="flex justify-between items-center">
                <span>
                  {a.email} ({a.user_id})
                </span>
                <button
                  onClick={() => removeAdmin(a.user_id)}
                  className="px-2 py-1 bg-red-500 text-white rounded"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
