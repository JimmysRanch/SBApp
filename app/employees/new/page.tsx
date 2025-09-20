"use client";
export const runtime = "nodejs";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Card from "@/components/Card";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/components/AuthProvider";

type PermissionKey =
  | "can_view_reports"
  | "can_edit_schedule"
  | "can_manage_discounts"
  | "can_manage_staff";

type PayType = "hourly" | "commission" | "salary" | "hybrid";

const inputClass =
  "h-11 w-full rounded-xl border border-white/50 bg-white/95 px-4 text-base text-brand-navy placeholder:text-brand-navy/50 shadow-inner transition focus:border-brand-bubble focus:outline-none focus:ring-2 focus:ring-brand-bubble/30";
const textareaClass =
  "min-h-[96px] w-full rounded-xl border border-white/50 bg-white/95 px-4 py-3 text-base text-brand-navy placeholder:text-brand-navy/50 shadow-inner transition focus:border-brand-bubble focus:outline-none focus:ring-2 focus:ring-brand-bubble/30";
const labelClass = "text-sm font-semibold text-brand-navy";

const STATUS_OPTIONS = ["Active", "Inactive", "On leave"] as const;
const PAY_TYPE_OPTIONS: PayType[] = ["hourly", "commission", "salary", "hybrid"];
const PERMISSION_OPTIONS: { key: PermissionKey; label: string; helper: string }[] = [
  {
    key: "can_edit_schedule",
    label: "Edit schedule",
    helper: "Allows updating appointments and calendar entries.",
  },
  {
    key: "can_manage_discounts",
    label: "Manage discounts",
    helper: "Can apply appointment discounts and adjustments.",
  },
  {
    key: "can_view_reports",
    label: "View reports",
    helper: "Grants access to financial and performance reports.",
  },
  {
    key: "can_manage_staff",
    label: "Manage staff",
    helper: "Can update staff profiles and permissions.",
  },
];

type FormState = {
  name: string;
  email: string;
  phone: string;
  role: string;
  status: (typeof STATUS_OPTIONS)[number];
  payType: PayType;
  commissionPercent: string;
  hourlyRate: string;
  salaryRate: string;
};

const defaultPermissions: Record<PermissionKey, boolean> = {
  can_view_reports: false,
  can_edit_schedule: false,
  can_manage_discounts: false,
  can_manage_staff: false,
};

export default function NewEmployeePage() {
  const router = useRouter();
  const { loading: authLoading, session, permissions } = useAuth();

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    role: "",
    status: "Active",
    payType: "hourly",
    commissionPercent: "0",
    hourlyRate: "",
    salaryRate: "",
  });
  const [permissionState, setPermissionState] = useState<Record<PermissionKey, boolean>>({
    ...defaultPermissions,
  });
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageEmployees = useMemo(() => permissions.canManageEmployees, [permissions.canManageEmployees]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    const trimmedName = form.name.trim();
    const trimmedRole = form.role.trim();

    if (!trimmedName || !trimmedRole) {
      setError("Name and role are required");
      return;
    }

    const commissionValue = form.commissionPercent.trim() === ""
      ? null
      : Number(form.commissionPercent.replace(/,/g, ".")) / 100;
    if (commissionValue !== null && !Number.isFinite(commissionValue)) {
      setError("Commission percentage must be a valid number");
      return;
    }
    if (commissionValue !== null && (commissionValue < 0 || commissionValue > 1)) {
      setError("Commission percentage must be between 0% and 100%");
      return;
    }

    const hourlyValue = form.hourlyRate.trim() === "" ? null : Number(form.hourlyRate);
    if (hourlyValue !== null && (!Number.isFinite(hourlyValue) || hourlyValue < 0)) {
      setError("Hourly rate must be zero or greater");
      return;
    }

    const salaryValue = form.salaryRate.trim() === "" ? null : Number(form.salaryRate);
    if (salaryValue !== null && (!Number.isFinite(salaryValue) || salaryValue < 0)) {
      setError("Salary rate must be zero or greater");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          role: trimmedRole,
          email: form.email.trim(),
          phone: form.phone,
          status: form.status,
          pay_type: form.payType,
          commission_rate: commissionValue,
          hourly_rate: hourlyValue,
          salary_rate: salaryValue,
          app_permissions: permissionState,
          manager_notes: notes.trim() ? notes.trim() : null,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({ error: "Failed to create staff member" }));
        setError(result.error ?? "Unable to create staff member");
        setSaving(false);
        return;
      }

      const result = await response.json();
      const staffId: number | null = result?.data?.id ?? null;
      router.push(staffId ? `/employees/${staffId}` : "/employees");
    } catch (caught) {
      console.error("Failed to create staff member", caught);
      setError("Something went wrong while creating the staff member");
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <PageContainer>
        <Card>
          <p className="text-sm text-brand-navy/70">Checking your permissions…</p>
        </Card>
      </PageContainer>
    );
  }

  if (!session) {
    return (
      <PageContainer>
        <Card>
          <p className="text-sm text-brand-navy/70">Please sign in to add team members.</p>
        </Card>
      </PageContainer>
    );
  }

  if (!canManageEmployees) {
    return (
      <PageContainer>
        <Card>
          <h1 className="text-2xl font-semibold text-brand-navy">Access restricted</h1>
          <p className="mt-2 text-sm text-brand-navy/70">
            You do not have permission to add staff members. Ask an administrator to adjust your access if you
            believe this is a mistake.
          </p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-4xl space-y-8">
      <Card className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-navy/50">New team member</p>
            <h1 className="text-3xl font-bold text-brand-navy">Add employee</h1>
            <p className="text-sm text-brand-navy/70">
              Create a staff profile so they can be scheduled, tracked, and included in your reports.
            </p>
          </div>
          <Link
            href="/employees"
            className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/80 px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-bubble/40"
          >
            Cancel
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-300/60 bg-red-100/70 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          <section className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-brand-navy">Personal details</h2>
              <p className="text-sm text-brand-navy/70">
                We use this information for contact, scheduling, and quick access throughout the dashboard.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className={labelClass} htmlFor="employee-name">
                  Full name
                </label>
                <input
                  id="employee-name"
                  className={inputClass}
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="employee-role">
                  Role
                </label>
                <input
                  id="employee-role"
                  className={inputClass}
                  value={form.role}
                  onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="employee-email">
                  Email
                </label>
                <input
                  id="employee-email"
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="person@example.com"
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="employee-phone">
                  Phone
                </label>
                <input
                  id="employee-phone"
                  className={inputClass}
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="(555) 555-1234"
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="employee-status">
                  Status
                </label>
                <select
                  id="employee-status"
                  className={inputClass}
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, status: event.target.value as (typeof STATUS_OPTIONS)[number] }))
                  }
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-brand-navy">Compensation & access</h2>
              <p className="text-sm text-brand-navy/70">
                Configure how this employee is paid and the tools they can manage inside Scruffy Butts.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className={labelClass} htmlFor="employee-pay-type">
                  Pay type
                </label>
                <select
                  id="employee-pay-type"
                  className={inputClass}
                  value={form.payType}
                  onChange={(event) => setForm((prev) => ({ ...prev, payType: event.target.value as PayType }))}
                >
                  {PAY_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="employee-commission">
                  Commission %
                </label>
                <input
                  id="employee-commission"
                  className={inputClass}
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={form.commissionPercent}
                  onChange={(event) => setForm((prev) => ({ ...prev, commissionPercent: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="employee-hourly">
                  Hourly rate
                </label>
                <input
                  id="employee-hourly"
                  className={inputClass}
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.hourlyRate}
                  onChange={(event) => setForm((prev) => ({ ...prev, hourlyRate: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="employee-salary">
                  Salary rate
                </label>
                <input
                  id="employee-salary"
                  className={inputClass}
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.salaryRate}
                  onChange={(event) => setForm((prev) => ({ ...prev, salaryRate: event.target.value }))}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-brand-bubble/30 bg-brand-bubble/10 p-4">
              <h3 className="text-sm font-semibold text-brand-navy">App permissions</h3>
              <p className="mt-1 text-xs text-brand-navy/70">
                Choose which areas of the workspace this team member can access. You can fine-tune these later in their
                settings.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {PERMISSION_OPTIONS.map((option) => (
                  <label key={option.key} className="flex items-start gap-2 text-sm text-brand-navy">
                    <input
                      type="checkbox"
                      checked={permissionState[option.key]}
                      onChange={(event) =>
                        setPermissionState((prev) => ({
                          ...prev,
                          [option.key]: event.target.checked,
                        }))
                      }
                      className="mt-1 h-4 w-4 rounded border-brand-bubble/50 text-brand-bubble focus:ring-brand-bubble/50"
                    />
                    <span>
                      <span className="font-semibold">{option.label}</span>
                      <span className="block text-xs text-brand-navy/70">{option.helper}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-brand-navy">Manager notes</h2>
            <p className="text-sm text-brand-navy/70">
              Keep track of training progress, specialties, or anything the rest of the team should know.
            </p>
            <textarea
              className={textareaClass}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional notes for managers"
            />
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-brand-navy/60">
              Staff can be edited later to add addresses, emergency contacts, and scheduling preferences.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full bg-brand-bubble px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-bubbleDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : "Create employee"}
            </button>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}
         