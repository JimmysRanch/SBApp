"use client";
export const runtime = "nodejs";
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
        <Card className="space-y-5" outerClassName="md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.42em] text-brand-navy/50">Team</p>
              <h1 className="font-serif text-3xl font-semibold text-brand-navy">Employees</h1>
            </div>
            <Link
              href="/employees/new"
              className="group relative inline-flex items-center overflow-hidden rounded-full bg-gradient-to-r from-brand-blue via-brand-mint to-secondary px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white shadow-[0_20px_45px_-30px_rgba(77,104,255,0.55)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              <span className="relative z-10">Add Employee</span>
              <span className="absolute inset-0 -z-10 bg-gradient-to-r from-white/15 via-transparent to-white/15 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-brand-navy/60">Loading…</p>
          ) : (
            <ul className="space-y-3">
              {rows.map((e) => (
                <li
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className="group relative flex cursor-pointer items-center justify-between overflow-hidden rounded-[1.7rem] border border-brand-navy/5 bg-white/95 px-5 py-4 shadow-[0_18px_35px_-30px_rgba(7,12,30,0.45)] transition-transform duration-200 hover:-translate-y-1"
                >
                  <div>
                    <p className="text-sm font-semibold text-brand-navy">{e.name}</p>
                    <p className="text-xs text-brand-navy/60">{e.active ? "Active" : "Inactive"}</p>
                  </div>
                  <span className="text-sm font-semibold text-brand-blue">Details</span>
                  {selected?.id === e.id && (
                    <Link
                      href={`/employees/${e.id}`}
                      className="absolute inset-0 flex items-center justify-center bg-brand-blue/80 text-sm font-semibold uppercase tracking-[0.4em] text-white"
                    >
                      Open Profile
                    </Link>
                  )}
                  <span className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-brand-blue/10 via-transparent to-brand-mint/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="space-y-3" outerClassName="md:col-start-3">
          {selected ? (
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-semibold text-brand-navy">Quick View</h2>
              <div className="rounded-2xl border border-brand-navy/10 bg-white/90 p-4 shadow-[0_16px_35px_-30px_rgba(7,12,30,0.4)]">
                <p className="text-sm font-semibold text-brand-navy">{selected.name}</p>
                <p className="mt-1 text-xs text-brand-navy/60">
                  Status: {selected.active ? "Active" : "Inactive"}
                </p>
              </div>
              <Link
                href={`/employees/${selected.id}`}
                className="inline-flex items-center justify-center rounded-full border border-brand-blue/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-brand-blue transition hover:border-brand-blue hover:bg-brand-blue/10"
              >
                View full profile
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-serif text-xl font-semibold text-brand-navy">Employee Details</h2>
              <p className="text-sm text-brand-navy/60">Select an employee to view details.</p>
            </>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
