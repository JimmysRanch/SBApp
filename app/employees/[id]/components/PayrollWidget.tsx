"use client";
import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { supabase } from "../../../../supabase/client";

function weekStart(d = new Date()) {
  const s = new Date(d); s.setHours(0,0,0,0);
  s.setDate(s.getDate() - s.getDay());
  return s;
}

export default function PayrollWidget({ employeeId }: { employeeId: number }) {
  const [grossCents, setGrossCents] = useState(0);

  useEffect(() => {
    let on = true;
    (async () => {
      const start = weekStart();
      const end = new Date(start); end.setDate(start.getDate() + 7);
      const { data } = await supabase
        .from("appointments")
        .select("price_cents,start_time,status")
        .eq("employee_id", employeeId)
        .eq("status", "completed")
        .gte("start_time", start.toISOString())
        .lt("start_time", end.toISOString());
      const total = (data ?? []).reduce((s, r: any) => s + (r.price_cents ?? 0), 0);
      if (on) setGrossCents(total);
    })();
    return () => { on = false; };
  }, [employeeId]);

  const dollars = (grossCents / 100).toFixed(2);
  return (
    <Card>
      <h3 className="text-lg font-semibold">Payroll (Week-to-Date)</h3>
      <div className="mt-3 text-2xl font-bold">${dollars}</div>
      <div className="text-sm text-gray-600">Completed appointment revenue</div>
    </Card>
  );
}
