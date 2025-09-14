import { notFound } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import { createClient } from "@/supabase/server";
import LifetimeTotalsCard from "../components/LifetimeTotalsCard";
import PerformanceCard from "../components/PerformanceCard";

type Params = { id: string };

export const dynamic = "force-dynamic";

export default async function HistoryPage({ params }: { params: Params }) {
  const supabase = createClient();
  const empId = Number(params.id);
  const { data: employee, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", empId)
    .single();
  if (error || !employee) {
    notFound();
  }
  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-4">Employee History</h1>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <LifetimeTotalsCard employeeId={empId} />
        <PerformanceCard employeeId={empId} />
      </div>
    </PageContainer>
  );
}
