import { createServerClient } from "@/lib/supabase/server";

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

interface PayrollPageProps {
  params: { id: string };
}

export default async function PayrollPage({ params }: PayrollPageProps) {
  const supabase = createServerClient();
  const staffId = Number(params.id);
  const { data: lines } = await supabase
    .from("payroll_lines_view")
    .select("*")
    .eq("staff_id", staffId)
    .order("start_time", { ascending: true });

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Paycheck Details</h2>
          <a
            href={`/api/payroll/export?staff_id=${staffId}`}
            className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-neutral-50"
          >
            Download CSV
          </a>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-neutral-600">
              <tr>
                <th>Date &amp; Time</th>
                <th>Service</th>
                <th>Base</th>
                <th>Commission</th>
                <th>Adjustment</th>
                <th>Final</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {lines?.map((line) => {
                const basePrice = Number(line.base_price ?? 0);
                const commissionRate = Number(line.commission_rate ?? 0);
                const commissionAmount = Number(line.commission_amount ?? 0);
                const adjustmentAmount = Number(line.adjustment_amount ?? 0);
                const finalEarnings = Number(line.final_earnings ?? 0);
                const start = line.start_time ? new Date(line.start_time) : null;
                const end = line.end_time ? new Date(line.end_time) : null;

                return (
                  <tr key={line.appointment_id} className="border-t">
                    <td>
                      {start ? start.toLocaleString() : ""}
                      {start && end
                        ? `–${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                        : ""}
                    </td>
                    <td>{line.service}</td>
                    <td>{money(basePrice)}</td>
                    <td>
                      {commissionRate}% → {money(commissionAmount)}
                    </td>
                    <td>{adjustmentAmount ? `-${money(adjustmentAmount)}` : "-"}</td>
                    <td className="font-medium">{money(finalEarnings)}</td>
                    <td>{line.adjustment_reason || ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
