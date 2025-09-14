"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { supabase } from "@/supabase/client";

type Props = { employeeId: string };

export default function LifetimeTotalsCard({ employeeId }: Props) {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const loadTotals = async () => {
      const { count } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("employee_id", employeeId);
      if (typeof count === "number") {
        setTotal(count);
      }
    };
    loadTotals();
  }, [employeeId]);

  if (total === null) {
    return (
      <Card>
        <h2 className="mb-2 text-lg font-semibold">Lifetime Totals</h2>
        Loading...
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-2 text-lg font-semibold">Lifetime Totals</h2>
      <p>Total Grooms: {total}</p>
    </Card>
  );
}
