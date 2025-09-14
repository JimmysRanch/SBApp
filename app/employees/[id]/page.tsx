"use client";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface Employee {
  id: string;
  name: string;
  active: boolean | null;
}

export default function EmployeePage({ params }: { params: { id: string } }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase
        .from("employees")
        .select("id, name, active")
        .eq("id", params.id)
        .single();
      if (data) setEmployee(data as Employee);
      setLoading(false);
    };
    run();
  }, [params.id]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 pb-20 md:p-8">
        {loading && <p>Loading…</p>}
        {!loading && employee && (
          <>
            <h1 className="mb-4 text-2xl font-bold text-primary-dark">
              {employee.name}
            </h1>
            <p className="text-gray-600">
              Status: {employee.active ? "Active" : "Inactive"}
            </p>
          </>
        )}
      </main>
    </div>
  );
}

