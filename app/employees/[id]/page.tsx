"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import { supabase } from "@/lib/supabase/client";

interface Employee {
  id: string;
  name: string;
  active: boolean | null;
}

export default function EmployeePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, name, active")
        .eq("id", params.id)
        .single();
      if (error || !data) {
        router.push("/employees");
      } else {
        setEmployee(data as Employee);
      }
      setLoading(false);
    };
    load();
  }, [params.id, router]);

  if (loading) {
    return (
      <PageContainer>
        <Card>
          <p>Loading…</p>
        </Card>
      </PageContainer>
    );
  }

  if (!employee) {
    return (
      <PageContainer>
        <Card>
          <p>Employee not found.</p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Card>
        <h1 className="mb-4 text-2xl font-bold text-primary-dark">
          {employee.name}
        </h1>
        <p className="text-gray-600">
          Status: {employee.active ? "Active" : "Inactive"}
        </p>
      </Card>
    </PageContainer>
  );
}

