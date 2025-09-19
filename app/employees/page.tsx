"use client";
export const runtime = "nodejs";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import { useEffect, useState } from "react";
import clsx from "clsx";
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
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Team roster</p>
              <h1 className="text-3xl font-semibold text-brand-charcoal">Employees</h1>
              <p className="text-sm text-slate-500">
                Tap any teammate to preview their status and open their profile.
              </p>
            </div>
            <Link
              href="/employees/new"
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:translate-y-[-2px] hover:bg-primary-dark"
            >
              Add employee
            </Link>
          </div>
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-500">
              Loading roster…
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-white">
              {rows.map((e) => {
                const isSelected = selected?.id === e.id;
                return (
                  <li
                    key={e.id}
                    onClick={() => setSelected(e)}
                    className="relative flex cursor-pointer items-center justify-between px-5 py-4 transition hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-brand-charcoal">{e.name}</p>
                      <p className="text-xs text-slate-500">ID: {e.id}</p>
                    </div>
                    <span
                      className={clsx(
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                        e.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600',
                      )}
                    >
                      {e.active ? 'Active' : 'Inactive'}
                    </span>
                    {isSelected && (
                      <Link
                        href={`/employees/${e.id}`}
                        className="absolute inset-2 flex items-center justify-center rounded-2xl bg-primary/90 text-sm font-semibold text-white shadow-lg"
                      >
                        View profile
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card>
          {selected ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-brand-charcoal">Quick view</h2>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Name</p>
                <p className="text-xl font-semibold text-brand-charcoal">{selected.name}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Status</p>
                <p className="text-base font-medium text-brand-charcoal">
                  {selected.active ? 'Currently active' : 'Marked inactive'}
                </p>
              </div>
              <Link
                href={`/employees/${selected.id}`}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-charcoal transition hover:border-primary hover:text-primary"
              >
                Open full profile
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-brand-charcoal">Employee details</h2>
              <p className="text-sm text-slate-500">
                Select a teammate from the list to preview their status and jump into their profile page.
              </p>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
