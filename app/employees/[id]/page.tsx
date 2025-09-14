import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function EmployeeDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("employees")
    .select("id, name, active")
    .eq("id", params.id)
    .single();

  if (!data) {
    notFound();
  }

  const employee = data as { id: string; name: string; active: boolean | null };

  return (
    <PageContainer>
      <Card className="space-y-2">
        <h1 className="text-3xl font-bold text-primary-dark">{employee.name}</h1>
        <p className="text-sm text-gray-600">
          Status: {employee.active ? "Active" : "Inactive"}
        </p>
      </Card>
    </PageContainer>
  );
}
