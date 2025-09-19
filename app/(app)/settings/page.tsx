'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type AdminRow = { user_id: string; email: string | null };

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setErr(null);

    const { data: ures, error: uerr } = await supabase.auth.getUser();
    if (uerr) { setErr(uerr.message); setLoading(false); return; }
    const user = ures.user;
    if (!user) { setErr('Not logged in'); setLoading(false); return; }

    setEmail(user.email ?? null);

    const { data: emp } = await supabase
      .from('employees')
      .select('name')
      .eq('user_id', user.id)
      .maybeSingle();
    setName(emp?.name ?? null);

    const { data: list, error: lerr } = await supabase.rpc('admin_list');
    if (!lerr && Array.isArray(list)) { setIsAdmin(true); setAdmins(list as AdminRow[]); }
    else { setIsAdmin(false); setAdmins([]); }

    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addAdmin() {
    setErr(null);
    const email = newAdminEmail.trim();
    if (!email) return;
    const { error } = await supabase.rpc('admin_add', { p_email: email });
    if (error) { setErr(error.message); return; }
    setNewAdminEmail('');
    await load();
  }

  async function removeAdmin(email: string | null) {
    if (!email) return;
    setErr(null);
    const { error } = await supabase.rpc('admin_remove', { p_email: email });
    if (error) { setErr(error.message); return; }
    await load();
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Settings</h1>

      {err && <div style={{ color: '#b00020', marginBottom: 12 }}>Error: {err}</div>}

      <div style={{ marginBottom: 8 }}>
        <strong>Logged in as:</strong>{' '}
        {name ? `${name} (${email ?? 'no email'})` : (email ?? 'unknown')}
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong>Role:</strong> {isAdmin ? 'Owner / Admin' : 'Employee'}
      </div>

      <button onClick={logout} style={{ padding: '8px 12px', marginBottom: 24 }}>
        Log out
      </button>

      {loading ? <div>Loading…</div> : null}

      {isAdmin && (
        <div>
          <h2 style={{ marginTop: 8 }}>Admin management</h2>

          <div style={{ display: 'flex', gap: 8, margin: '8px 0 16px' }}>
            <input
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="Add admin by email"
              style={{ padding: 8, flex: 1 }}
            />
            <button onClick={addAdmin} style={{ padding: '8px 12px' }}>Add</button>
          </div>

          <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                <th>Email</th>
                <th>User ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(admins ?? []).map(a => (
                <tr key={a.user_id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                  <td>{a.email ?? '—'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{a.user_id}</td>
                  <td>
                    <button onClick={() => removeAdmin(a.email)} style={{ padding: '6px 10px' }}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr><td colSpan={3}>No admins listed.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
