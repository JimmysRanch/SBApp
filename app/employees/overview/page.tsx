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
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);

      // find the employee row tied to the logged-in user
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

      // load all appointments for this employee
      const { data: appts, error: apptErr } = await supabase
        .from('appointments')
        .select('start_time, price')
        .eq('employee_id', empId);

      if (apptErr) {
        setErr(apptErr.message);
        setLoading(false);
        return;
      }

      const todayStr = new Date().toDateString();
      const todayAppts = (appts || []).filter(
        (a) => new Date(a.start_time).toDateString() === todayStr
      );

      setDogsToday(todayAppts.length);
      setRevToday(todayAppts.reduce((s, a) => s + Number(a.price || 0), 0));
      setDogsLife((appts || []).length);
      setRevLife((appts || []).reduce((s, a) => s + Number(a.price || 0), 0));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (err) return <div style={{ padding: 16, color: '#b00020' }}>Error: {err}</div>;

  return (
    <div style={{ padding: 16 }}>
      <h1>Employee Overview</h1>
      <p>Today: {dogsToday} dogs • ${revToday.toFixed(2)}</p>
      <p>Lifetime: {dogsLife} dogs • ${revLife.toFixed(2)}</p>
    </div>
  );
}
