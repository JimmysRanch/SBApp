'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Admin = { user_id: string; email: string | null };

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [newAdmin, setNewAdmin] = useState('');

  async function load() {
    setLoading(true); setErr(null);

    const { data: ures, error: uerr } = await supabase.auth.getUser();
    if (uerr || !ures.user) { setErr(uerr?.message ?? 'Not logged in'); setLoading(false); return; }
    const user = ures.user;
    setEmail(user.email ?? null);

    const { data: emp } = await supabase.from('employees').select('name').eq('user_id', user.id).maybeSingle();
    setName(emp?.name ?? null);

    const { data: adminFlag, error: fErr } = await supabase.rpc('is_admin');
    const iAmAdmin = !!(adminFlag === true && !fErr);
    setIsAdmin(iAmAdmin);

    if (iAmAdmin) {
      const { data: list, error: lerr } = await supabase.rpc('admin_list');
      setAdmins(!lerr && Array.isArray(list) ? (list as any) : []);
    } else {
      setAdmins([]);
    }

    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addAdmin() {
    const e = newAdmin.trim();
    if (!e) return;
    const { error } = await supabase.rpc('admin_add', { p_email: e });
    if (error) setErr(error.message);
    setNewAdmin('');
    load();
  }

  async function removeAdmin(email: string | null) {
    if (!email) return;
    const { error } = await supabase.rpc('admin_remove', { p_email: email });
    if (error) setErr(error.message);
    load();
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Your existing sub-pages */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Configuration</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li><a className="text-blue-600 underline" href="/settings/profile">Profile</a></li>
          <li><a className="text-blue-600 underline" href="/settings/business">Business</a></li>
          <li><a className="text-blue-600 underline" href="/settings/services">Services</a></li>
          <li><a className="text-blue-600 underline" href="/settings/notifications">Notifications</a></li>
          <li><a className="text-blue-600 underline" href="/settings/billing">Billing</a></li>
        </ul>
      </div>

      <div>
        <p><strong>Logged in as:</strong> {name ?? email}</p>
        <p><strong>Role:</strong> {isAdmin ? 'Owner / Admin' : 'Employee (limited)'}</p>
      </div>

      <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded">Log out</button>

      {isAdmin && (
        <div>
          <h2 className="text-xl font-semibold mt-6">Admin management</h2>
          <div className="flex gap-2 mt-2">
            <input
              type="email"
              value={newAdmin}
              onChange={(e) => setNewAdmin(e.target.value)}
              placeholder="Add admin by email"
              className="border p-2 flex-1"
            />
            <button onClick={addAdmin} className="px-4 py-2 bg-blue-600 text-white rounded">Add</button>
          </div>

          <table className="mt-4 w-full text-left">
            <thead><tr className="border-b"><th className="py-1">Email</th><th className="py-1">User ID</th><th className="py-1">Actions</th></tr></thead>
            <tbody>
              {admins.length === 0 && <tr><td className="py-2 text-gray-500" colSpan={3}>No admins listed.</td></tr>}
              {admins.map((a) => (
                <tr key={a.user_id} className="border-b">
                  <td className="py-2">{a.email ?? '—'}</td>
                  <td className="py-2">{a.user_id}</td>
                  <td className="py-2">
                    <button onClick={() => removeAdmin(a.email)} className="px-2 py-1 bg-red-500 text-white rounded">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
