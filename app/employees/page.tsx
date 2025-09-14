import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// Type definition for an employee record
interface Employee {
  id: string;
  name: string;
  active: boolean | null;
}

/**
 * Employees list page. Displays employees and links to create or view
 * individual employee pages.
 */
export default async function EmployeesPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id,name,active")
    .order("name");
  const employees: Employee[] = !error && data ? (data as Employee[]) : [];

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
        {employees.length === 0 ? (
          <p className="text-gray-600">No employees found.</p>
        ) : (
          <ul className="divide-y">
            {employees.map((e) => (
              <li key={e.id} className="flex justify-between py-3">
                <Link
                  href={`/employees/${e.id}`}
                  className="font-medium hover:underline"
                >
                  {e.name}
                </Link>
                <span className="text-sm text-gray-600">
                  {e.active ? "Active" : "Inactive"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageContainer>
  );
}
