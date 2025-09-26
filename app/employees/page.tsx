"use client";
export const runtime = "nodejs";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

// Type definition for an employee record
const INACTIVE_KEYWORDS = ["inactive", "archived", "disabled", "terminated", "deleted"];

interface Employee {
  id: string;
  name: string;
  active: boolean;
}

function inferIsActive(record: Record<string, unknown> | null | undefined) {
  if (!record || typeof record !== "object") {
    return true;
  }

  const boolKeys = ["active", "is_active", "enabled", "is_enabled"] as const;
  for (const key of boolKeys) {
    const value = (record as Record<string, unknown>)[key];
    if (typeof value === "boolean") {
      return value;
    }
  }

  const status = (record as Record<string, unknown>).status;
  if (typeof status === "string") {
    const lowered = status.toLowerCase();
    if (INACTIVE_KEYWORDS.some((flag) => lowered.includes(flag))) {
      return false;
    }
  }

  const archivedAt = (record as Record<string, unknown>).archived_at;
  if (archivedAt !== null && archivedAt !== undefined) {
    return false;
  }

  return true;
}

function coerceString(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
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
      const { data, error } = await supabase.from("employees").select("*").order("name");
      if (!error && data) {
        const mapped = (data as any[]).map((row, index) => ({
          id: coerceString(row.id, `staff-${index + 1}`),
          name: coerceString(row.name, `Staff #${index + 1}`),
          active: inferIsActive(row),
        }));
        setRows(mapped);
      }
      setLoading(false);
    };
    run();
  }, []);

  return (
    <PageContainer>
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="space-y-4 md:col-span-2">
          <h1 className="text-3xl font-bold text-primary-dark">Staff</h1>
          <div>
            <Link
              href="/employees/new"
              className="inline-block rounded-full bg-primary px-4 py-2 text-white shadow hover:bg-primary-dark"
            >
              Add Staff Member
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
