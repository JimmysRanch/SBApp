"use client";
import { useEffect, useState } from "react";
import Widget from "@/components/Widget";
import { supabase } from "@/lib/supabase/client";

type Props = { employeeId: string };

type Period = {
  start_date: string;
  end_date: string;
  total: number | null;
};

export default function PayrollWidget({ employeeId }: Props) {
  const [period, setPeriod] = useState<Period | null>(null);

  useEffect(() => {
    const fetchPayroll = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("pay_periods")
        .select("start_date,end_date,total")
        .eq("employee_id", employeeId)
        .lte("start_date", today)
        .gte("end_date", today)
        .maybeSingle();
      if (!error && data) {
        setPeriod(data as Period);
      }
    };
    fetchPayroll();
  }, [employeeId]);

  return (
    <Widget title="Payroll" color="pink">
      {period ? (
        <div className="text-sm text-gray-700">
          <p>
            Period: {period.start_date} - {period.end_date}
          </p>
          <p>Total: ${period.total?.toFixed(2) ?? "0.00"}</p>
        </div>
      ) : (
        <p className="text-sm text-gray-600">No payroll data.</p>
      )}
    </Widget>
  );
}
