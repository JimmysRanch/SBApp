import { notFound } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import { createClient } from "@/lib/supabase/server";

type Params = { params: { id: string } };
type Employee = { id: string; name: string; active: boolean | null };

export default async function EmployeePage({ params }: Params) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("employees").select("id,name,active").eq("id", params.id).single();

  if (error || !data) notFound();
  const employee = data as Employee;

  return (
    <PageContainer>
      <Card>
        <h1 className="mb-4 text-3xl font-bold text-primary-dark">{employee.name}</h1>
        <p className="text-gray-600">Status: {employee.active ? "Active" : "Inactive"}</p>
      </Card>
    </PageContainer>
  );
}
