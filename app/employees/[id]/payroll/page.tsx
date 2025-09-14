import { notFound } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import { createClient } from "@/supabase/server";
import PayrollWidget from "../components/PayrollWidget";

type Params = { id: string };

export const dynamic = "force-dynamic";

export default async function PayrollPage({ params }: { params: Params }) {
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
      <h1 className="text-2xl font-bold mb-4">Payroll</h1>
      <PayrollWidget employeeId={empId} />
    </PageContainer>
  );
}
