'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
type Role = { id:string; name:string; permissions:string[] };

export default function RolesSettings() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [name, setName] = useState('');
  const [perms, setPerms] = useState<string>('[]');

  async function load() {
    const { data } = await supabase.from('roles').select('id,name,permissions').order('name');
    setRoles(data || []);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    const { error } = await supabase.from('roles').insert({ name, permissions: JSON.parse(perms) });
    if (error) alert(error.message); else { setName(''); setPerms('[]'); load(); }
  }
  async function remove(id:string) {
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) alert(error.message); else load();
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Roles & Permissions</h2>
      <div className="flex gap-2">
        <input placeholder="Role name" value={name} onChange={e=>setName(e.target.value)} className="border px-2 py-1 rounded w-40"/>
        <input placeholder='["perm"]' value={perms} onChange={e=>setPerms(e.target.value)} className="border px-2 py-1 rounded flex-1"/>
        <button onClick={add} className="rounded bg-black text-white px-3 py-2">Add</button>
      </div>
      <ul className="space-y-2">
        {roles.map(r => (
          <li key={r.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="text-xs opacity-70">{JSON.stringify(r.permissions)}</div>
            </div>
            <button onClick={()=>remove(r.id)} className="text-red-600 text-sm">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
