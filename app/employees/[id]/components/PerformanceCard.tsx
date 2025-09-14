import Card from "@/components/Card";
import { supabase } from "../../../../supabase/client";

type Props = { employeeId: string };

export default function PerformanceCard({ employeeId }: Props) {
  return (
    <Card>
      <h2 className="mb-2 text-lg font-semibold">Performance</h2>
      <p>Mock performance metrics for {employeeId}</p>
    </Card>
  );
}
