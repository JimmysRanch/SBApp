// app/employees/payroll/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

type Row = {
  id: number;
  paid_at: string;
  base_dollars: number;
  commission_dollars: number;
  override_dollars: number;
  tip_dollars: number;
  guarantee_topup_dollars: number;
  final_dollars: number;
};

export default function EmployeePayrollPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setErr(null);

    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) { setErr('No logged-in user'); setLoading(false); return; }

    const { data: emp, error: empErr } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', uid)
      .single();
    if (empErr || !emp) { setErr(empErr?.message || 'Employee not found'); setLoading(false); return; }
    const empId = emp.id;

    const { data, error } = await supabase
      .from('payroll_lines_ui')
      .select('id,paid_at,base_dollars,commission_dollars,override_dollars,tip_dollars,guarantee_topup_dollars,final_dollars')
      .eq('employee_id', empId)
      .order('paid_at', { ascending: false });

    if (error) setErr(error.message);
    else setRows(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Payroll</h1>

      {err && <div style={{ color: '#b00020', marginBottom: 12 }}>Error: {err}</div>}
      {!loading && rows.length === 0 && !err && <div>No payroll entries found.</div>}

      <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
            <th>Date</th>
            <th>Base</th>
            <th>Commission</th>
            <th>Override</th>
            <th>Tips</th>
            <th>Guarantee Top-up</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
              <td>{new Date(r.paid_at).toLocaleDateString()}</td>
              <td>${r.base_dollars.toFixed(2)}</td>
              <td>${r.commission_dollars.toFixed(2)}</td>
              <td>${r.override_dollars.toFixed(2)}</td>
              <td>${r.tip_dollars.toFixed(2)}</td>
              <td>${r.guarantee_topup_dollars.toFixed(2)}</td>
              <td><strong>${r.final_dollars.toFixed(2)}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
