'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function BusinessSettings() {
  const [rows, setRows] = useState([
    { dow:1, opens:'08:00', closes:'18:00' },
    { dow:2, opens:'08:00', closes:'18:00' },
    { dow:3, opens:'08:00', closes:'18:00' },
    { dow:4, opens:'08:00', closes:'18:00' },
    { dow:5, opens:'08:00', closes:'18:00' },
  ]);
  async function save() {
    setRows([...rows]);
    const { error } = await supabase.from('shop_hours').upsert(rows, { onConflict: 'dow' });
    if (error) alert(error.message); else alert('Saved');
  }
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Weekly Business Hours</h2>
      <pre className="text-xs bg-neutral-50 p-3 rounded-md">{JSON.stringify(rows, null, 2)}</pre>
      <button onClick={save} className="rounded bg-black text-white px-3 py-2">Save Hours</button>
    </div>
  );
}
