// app/employees/payroll/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

type Row = {
  id: number;
  paid_at: string;
  base_cents: number | null;
  commission_cents: number | null;
  final_cents: number | null;
};

export default function EmployeePayrollPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setErr(null);

    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) {
      setErr('No logged-in user');
      setLoading(false);
      return;
    }

    const { data: emp, error: empErr } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', uid)
      .single();

    if (empErr || !emp) {
      setErr(empErr?.message || 'Employee not found');
      setLoading(false);
      return;
    }

    const empId = emp.id;

    // last 30 days
    const fromISO = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const toISO = new Date().toISOString();

    const { data, error } = await supabase
      .from('payroll')
      .select('id,paid_at,base_cents,commission_cents,final_cents')
      .eq('employee_id', empId)
      .gte('paid_at', fromISO)
      .lte('paid_at', toISO)
      .order('paid_at', { ascending: false });

    if (error) setErr(error.message);
    else setRows(data ?? []);

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Payroll</h1>

      {err && (
        <div style={{ color: '#b00020', marginBottom: 12 }}>
          Error: {err}
        </div>
      )}

      {!loading && rows.length === 0 && !err && <div>No payroll entries found.</div>}

      <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
            <th>Date</th>
            <th>Base</th>
            <th>Commission</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
              <td>{new Date(r.paid_at).toLocaleDateString()}</td>
              <td>${Number((r.base_cents ?? 0) / 100).toFixed(2)}</td>
              <td>${Number((r.commission_cents ?? 0) / 100).toFixed(2)}</td>
              <td>${Number((r.final_cents ?? 0) / 100).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
