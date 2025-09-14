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
  const [selected, setSelected] = useState<Employee | null>(null);

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
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="space-y-4 md:col-span-2">
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
                <li
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className="relative flex cursor-pointer justify-between py-3"
                >
                  <span className="font-medium">{e.name}</span>
                  <span className="text-sm text-gray-600">{e.active ? "Active" : "Inactive"}</span>
                  {selected?.id === e.id && (
                    <Link
                      href={`/employees/${e.id}`}
                      className="absolute inset-0 flex items-center justify-center bg-primary/80 text-lg font-semibold text-white"
                    >
                      Employee Page
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="md:col-start-3">
          {selected ? (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-primary-dark">Quick View</h2>
              <p className="font-medium">{selected.name}</p>
              <p className="text-sm text-gray-600">
                Status: {selected.active ? "Active" : "Inactive"}
              </p>
            </div>
          ) : (
            <>
              <h2 className="mb-4 text-lg font-semibold text-primary-dark">Employee Details</h2>
              <p className="text-sm text-gray-600">Select an employee to view details.</p>
            </>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
