import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function EmployeePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from("employees")
    .select("id, name, active")
    .eq("id", params.id)
    .single();

  if (!data) {
    notFound();
  }

  return (
    <PageContainer>
      <Card>
        <h1 className="mb-4 text-2xl font-bold text-primary-dark">
          {data.name}
        </h1>
        <p className="text-gray-600">
          Status: {data.active ? "Active" : "Inactive"}
        </p>
      </Card>
    </PageContainer>
  );
}

