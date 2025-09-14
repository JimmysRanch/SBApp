"use client";
import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { supabase } from "@/lib/supabase/client";

type Props = { employeeId: string };

type Row = { price: number | null };

export default function LifetimeTotalsCard({ employeeId }: Props) {
  const [count, setCount] = useState(0);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    const fetchTotals = async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("price")
        .eq("employee_id", employeeId);
      if (!error && data) {
        const rows = data as Row[];
        setCount(rows.length);
        const total = rows.reduce((sum, r) => sum + (r.price || 0), 0);
        setRevenue(total);
      }
    };
    fetchTotals();
  }, [employeeId]);

  return (
    <Card>
      <h2 className="mb-2 text-lg font-semibold">Lifetime Totals</h2>
      <p>Appointments: {count}</p>
      <p>Revenue: ${revenue.toFixed(2)}</p>
    </Card>
  );
}
