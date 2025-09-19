// app/employees/overview/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

type Appt = { start_time: string; price: number | null };

export default function EmployeeOverviewPage() {
  const [dogsToday, setDogsToday] = useState(0);
  const [revToday, setRevToday] = useState(0);
  const [dogsLife, setDogsLife] = useState(0);
  const [revLife, setRevLife] = useState(0);

  const [uid, setUid] = useState<string | null>(null);
  const [empId, setEmpId] = useState<number | null>(null);
  const [diag, setDiag] = useState<string>('init');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      setDiag('getUser');

      // 1) Logged-in user?
      const u = await supabase.auth.getUser();
      const uidVal = u.data.user?.id ?? null;
      setUid(uidVal);
      if (!uidVal) {
        setErr('No logged-in user');
        setLoading(false);
        return;
      }

      // 2) employees.user_id -> my employee row?
      setDiag('getEmployee');
      const { data: emp, error: empErr } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', uidVal)
        .single();

      if (empErr || !emp) {
        setErr(empErr?.message || 'Employee not found for this user_id');
        setLoading(false);
        return;
      }
      setEmpId(emp.id);

      // 3) appointments for me (uses start_time, price)
      setDiag('getAppointments');
      const { data: appts, error: apptErr } = await supabase
        .from('appointments')
        .select('start_time, price')
        .eq('employee_id', emp.id);

      if (apptErr) {
        setErr(apptErr.message);
        setLoading(false);
        return;
      }

      const rows: Appt[] = (appts ?? []) as Appt[];
      const todayStr = new Date().toDateString();

      const todays = rows.filter(
        (a) => new Date(a.start_time).toDateString() === todayStr
      );
      const todayCount = todays.length;
      const todayRev = todays.reduce((s, a) => s + Number(a.price || 0), 0);

      const lifeCount = rows.length;
      const lifeRev = rows.reduce((s, a) => s + Number(a.price || 0), 0);

      setDogsToday(todayCount);
      setRevToday(todayRev);
      setDogsLife(lifeCount);
      setRevLife(lifeRev);

      setDiag('done');
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Employee Overview</h1>

      {loading && <div>Loading…</div>}

      {err && (
        <div style={{ color: '#b00020', marginBottom: 12 }}>
          Error: {err}
          <div style={{ marginTop: 8, fontSize: 12, color: '#555' }}>
            diag={diag} | uid={uid ?? '—'} | empId={empId ?? '—'}
          </div>
        </div>
      )}

      {!loading && !err && (
        <>
          <p>Today: {dogsToday} dogs • ${revToday.toFixed(2)}</p>
          <p>Lifetime: {dogsLife} dogs • ${revLife.toFixed(2)}</p>
          <div style={{ marginTop: 8, fontSize: 12, color: '#555' }}>
            diag={diag} | uid={uid} | empId={empId}
          </div>
        </>
      )}
    </div>
  );
}
