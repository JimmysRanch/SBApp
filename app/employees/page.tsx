"use client";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client"; 
import Link from "next/link";

// Type definition for an employee record
interface Employee {
  id: string;
  name: string;
  active: boolean | null;
}

/**
 * Employees list page.  Displays a list of employees and a button to
 * create a new employee.  An employee detail page could be added
 * similarly to the clients detail view.
 */
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
    <PageContainer>
      <Card className="space-y-4">
        <h1 className="text-3xl font-bold text-primary-dark">Employees</h1>
        <div>
          <Link
            href="/employees/new"
            className="inline-block rounded-full bg-primary px-4 py-2 text-white shadow hover:bg-primary-dark"
          >
            Add Employee
          </Link>
        </div>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <ul className="divide-y">
            {rows.map((e) => (
              <li key={e.id} className="flex justify-between py-3">
                <span className="font-medium">{e.name}</span>
                <span className="text-sm text-gray-600">{e.active ? "Active" : "Inactive"}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageContainer>
  );
}
