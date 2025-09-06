"use client";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Define the employee type
interface Employee {
  id: string;
  name: string;
  active: boolean | null;
}

export default function EmployeesPage() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, name, active")
        .order("name");
      if (!error && data) setRows(data as Employee[]);
      setLoading(false);
    };
    run();
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-4">Employees</h1>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <ul className="divide-y">
            {rows.map((e) => (
              <li key={e.id} className="py-3 flex justify-between">
                <span className="font-medium">{e.name}</span>
                <span className="text-sm text-gray-600">
                  {e.active ? "Active" : "Inactive"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
