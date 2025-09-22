// app/employees/payroll/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { resolveCurrentEmployee } from '@/lib/employees/current-employee';

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

    const { employeeId, error: employeeError } = await resolveCurrentEmployee();
    if (!employeeId) {
      setErr(employeeError || 'Employee not found');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('payroll_lines_ui')
      .select(`
        id,
        paid_at,
        base_dollars,
        commission_dollars,
        override_dollars,
        tip_dollars,
        guarantee_topup_dollars,
        final_dollars
      `)
      .eq('employee_id', employeeId)
      .order('paid_at', { ascending: false });

    if (error) setErr(error.message);
    else setRows((data as Row[]) ?? []);

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Payroll</h1>

      <div style={{ marginBottom: 12 }}>
        <button onClick={load} disabled={loading} style={{ padding: '8px 12px' }}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

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
            <th>Override</th>
            <th>Tips</th>
            <th>Guarantee Top-up</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
              <td>{new Date(r.paid_at).toLocaleDateString()}</td>
              <td>${(r.base_dollars ?? 0).toFixed(2)}</td>
              <td>${(r.commission_dollars ?? 0).toFixed(2)}</td>
              <td>${(r.override_dollars ?? 0).toFixed(2)}</td>
              <td>${(r.tip_dollars ?? 0).toFixed(2)}</td>
              <td>${(r.guarantee_topup_dollars ?? 0).toFixed(2)}</td>
              <td><strong>${(r.final_dollars ?? 0).toFixed(2)}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
