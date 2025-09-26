"use client";

import clsx from "clsx";

import { roleDisplayName } from "@/lib/auth/access";

import { useEmployeeDetail } from "../EmployeeDetailClient";

type StaffHeaderProps = {
  onCall: () => void;
  onText: () => void;
  onEmail: () => void;
};

function initials(name: string | null | undefined) {
  if (!name) return "SB";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) return "SB";
  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .padEnd(2, "B");
}

export default function StaffHeader({ onCall, onText, onEmail }: StaffHeaderProps) {
  const { employee } = useEmployeeDetail();

  const statusLabel = employee.status
    ? employee.status
    : employee.active === false
        ? "Inactive"
        : "Active";
  const roleLabel = employee.role ? roleDisplayName(employee.role) : null;

  const statusTone = clsx(
    "rounded-full border px-3 py-1 text-xs font-semibold capitalize",
    statusLabel.toLowerCase().includes("leave") && "border-amber-200 bg-amber-50 text-amber-700",
    statusLabel.toLowerCase().includes("inactive") && "border-slate-200 bg-slate-50 text-slate-500",
    statusLabel.toLowerCase().includes("active") && !statusLabel.toLowerCase().includes("inactive")
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : undefined,
    !statusLabel.toLowerCase().includes("active") &&
      !statusLabel.toLowerCase().includes("inactive") &&
      !statusLabel.toLowerCase().includes("leave") &&
      "border-brand-blue/40 bg-brand-blue/5 text-brand-blue"
  );

  const contactDetails = [employee.email, employee.phone].filter(Boolean).join(" · ");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="h-14 w-14 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            {employee.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={employee.avatar_url} alt={employee.name ?? "Staff avatar"} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-brand-blue">
                {initials(employee.name)}
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-brand-navy">{employee.name ?? "Staff member"}</h1>
              <span className={statusTone}>{statusLabel}</span>
            </div>
            <div className="text-sm font-medium text-slate-500">{roleLabel ?? "—"}</div>
            <div className="text-sm text-slate-400">{contactDetails || "No contact info"}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onCall}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-blue transition hover:border-brand-blue hover:bg-brand-blue/10"
          >
            Call
          </button>
          <button
            type="button"
            onClick={onText}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-blue transition hover:border-brand-blue hover:bg-brand-blue/10"
          >
            Text
          </button>
          <button
            type="button"
            onClick={onEmail}
            className="rounded-lg bg-brand-hotpink px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hotpink/90"
          >
            Email
          </button>
        </div>
      </div>
    </div>
  );
}
