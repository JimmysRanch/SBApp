"use client";
export const runtime = "nodejs";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import clsx from "clsx";
import Card from "@/components/Card";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/components/AuthProvider";
import { derivePermissionFlags } from "@/lib/auth/roles";
import {
  CompensationPlanDraft,
  defaultCompensationPlan,
  draftFromPlan,
  parseDraft,
  planHasConfiguration,
  planSummaryLines,
} from "@/lib/compensationPlan";
import { supabase } from "@/lib/supabase/client";

type PermissionKey =
  | "can_view_reports"
  | "can_edit_schedule"
  | "can_manage_discounts"
  | "can_manage_staff";

const inputClass =
  "h-11 w-full rounded-xl border border-white/50 bg-white/95 px-4 text-base text-brand-navy placeholder:text-brand-navy/50 shadow-inner transition focus:border-brand-bubble focus:outline-none focus:ring-2 focus:ring-brand-bubble/30";
const textareaClass =
  "min-h-[96px] w-full rounded-xl border border-white/50 bg-white/95 px-4 py-3 text-base text-brand-navy placeholder:text-brand-navy/50 shadow-inner transition focus:border-brand-bubble focus:outline-none focus:ring-2 focus:ring-brand-bubble/30";
const labelClass = "text-sm font-semibold text-brand-navy";

const STATUS_OPTIONS = ["Active", "Inactive", "On leave"] as const;
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

type RoleTemplate = {
  id: string;
  label: string;
  description: string;
  defaultPermissions: PermissionKey[];
};

const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: "groomer",
    label: "Groomer",
    description: "Handles grooming services, manages their appointments, and applies service discounts.",
    defaultPermissions: ["can_edit_schedule", "can_manage_discounts"],
  },
  {
    id: "front_desk",
    label: "Front desk",
    description: "Coordinates check-ins, keeps the calendar up to date, and can review basic reports.",
    defaultPermissions: ["can_edit_schedule", "can_view_reports"],
  },
  {
    id: "manager",
    label: "Manager",
    description: "Oversees the whole team with full access to schedules, reports, and staff settings.",
    defaultPermissions: [
      "can_edit_schedule",
      "can_manage_discounts",
      "can_view_reports",
      "can_manage_staff",
    ],
  },
  {
    id: "assistant",
    label: "Assistant",
    description: "Supports daily operations without changing schedules or staff records by default.",
    defaultPermissions: [],
  },
];

const CUSTOM_ROLE_ID = "custom";

const PERMISSION_LABEL_MAP: Record<PermissionKey, string> = PERMISSION_OPTIONS.reduce(
  (accumulator, option) => {
    accumulator[option.key] = option.label;
    return accumulator;
  },
  {} as Record<PermissionKey, string>,
);

type FormState = {
  name: string;
  email: string;
  phone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  role: string;
  status: (typeof STATUS_OPTIONS)[number];
};

const defaultPermissions: Record<PermissionKey, boolean> = {
  can_view_reports: false,
  can_edit_schedule: false,
  can_manage_discounts: false,
  can_manage_staff: false,
};

export default function NewEmployeePage() {
  const router = useRouter();
  const { loading: authLoading, role, profile } = useAuth();
  const permissions = useMemo(() => derivePermissionFlags(role), [role]);

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    role: "",
    status: "Active",
  });
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [customRoleDraft, setCustomRoleDraft] = useState("");
  const [permissionState, setPermissionState] = useState<Record<PermissionKey, boolean>>({
    ...defaultPermissions,
  });
  const [compensationDraft, setCompensationDraft] = useState<CompensationPlanDraft>(() =>
    draftFromPlan(defaultCompensationPlan),
  );
  const [staffOptions, setStaffOptions] = useState<{ id: number; name: string | null }[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageEmployees = useMemo(() => permissions.canManageEmployees, [permissions.canManageEmployees]);

  const staffNameMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const option of staffOptions) {
      map.set(option.id, option.name ?? `Staff #${option.id}`);
    }
    return map;
  }, [staffOptions]);

  const compensationPreview = useMemo(() => {
    const { plan } = parseDraft(compensationDraft);
    return {
      summary: planSummaryLines(plan, { staffNameMap }),
      hasConfiguration: planHasConfiguration(plan),
    };
  }, [compensationDraft, staffNameMap]);

  const applyPermissionPreset = (keys: PermissionKey[]) => {
    setPermissionState({
      can_view_reports: keys.includes("can_view_reports"),
      can_edit_schedule: keys.includes("can_edit_schedule"),
      can_manage_discounts: keys.includes("can_manage_discounts"),
      can_manage_staff: keys.includes("can_manage_staff"),
    });
  };

  useEffect(() => {
    let active = true;
    const loadStaffOptions = async () => {
      const { data, error: staffError } = await supabase
        .from("employees")
        .select("id,name")
        .order("name", { ascending: true });
      if (!active) return;
      if (staffError) {
        console.error("Failed to load staff list", staffError);
        setStaffOptions([]);
        return;
      }
      setStaffOptions((data as { id: number; name: string | null }[]) ?? []);
    };
    void loadStaffOptions();
    return () => {
      active = false;
    };
  }, []);

  const handleRoleTemplateSelect = (template: RoleTemplate) => {
    setSelectedRoleId(template.id);
    setForm((prev) => ({ ...prev, role: template.label }));
    applyPermissionPreset(template.defaultPermissions);
  };

  const handleCustomRoleSelect = () => {
    setSelectedRoleId(CUSTOM_ROLE_ID);
    const existingRole = form.role.trim();
    if (!customRoleDraft && existingRole) {
      setCustomRoleDraft(existingRole);
      setForm((prev) => ({ ...prev, role: existingRole }));
    } else {
      setForm((prev) => ({ ...prev, role: customRoleDraft }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    const trimmedName = form.name.trim();
    const trimmedRole = form.role.trim();

    if (!trimmedName || !trimmedRole) {
      setError("Name and role are required");
      return;
    }

    const draftResult = parseDraft(compensationDraft);
    if (draftResult.errors.length > 0) {
      setError(draftResult.errors.join(" "));
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
          address_street: form.addressStreet.trim() || null,
          address_city: form.addressCity.trim() || null,
          address_state: form.addressState.trim() || null,
          address_zip: form.addressZip.trim() || null,
          emergency_contact_name: form.emergencyContactName.trim() || null,
          emergency_contact_phone: form.emergencyContactPhone.trim() || null,
          status: form.status,
          pay_type: draftResult.payType,
          commission_rate: draftResult.commissionRate,
          hourly_rate: draftResult.hourlyRate,
          salary_rate: draftResult.salaryRate,
          compensation_plan: draftResult.plan,
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

  if (!profile) {
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
            You do not have permission to add staff members. Ask the Master Account or an Admin to adjust your access if
            you believe this is a mistake.
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
            <h1 className="text-3xl font-bold text-brand-navy">Add staff member</h1>
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <label className={labelClass} htmlFor="employee-address-street">
                  Street address
                </label>
                <input
                  id="employee-address-street"
                  className={inputClass}
                  value={form.addressStreet}
                  onChange={(event) => setForm((prev) => ({ ...prev, addressStreet: event.target.value }))}
                  placeholder="1234 Bark Lane"
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="employee-address-city">
                  City
                </label>
                <input
                  id="employee-address-city"
                  className={inputClass}
                  value={form.addressCity}
                  onChange={(event) => setForm((prev) => ({ ...prev, addressCity: event.target.value }))}
                  placeholder="Scruffyville"
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="employee-address-state">
                  State
                </label>
                <input
                  id="employee-address-state"
                  className={inputClass}
                  value={form.addressState}
                  onChange={(event) => setForm((prev) => ({ ...prev, addressState: event.target.value }))}
                  placeholder="WA"
                  maxLength={32}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="employee-address-zip">
                  ZIP / Postal code
                </label>
                <input
                  id="employee-address-zip"
                  className={inputClass}
                  value={form.addressZip}
                  onChange={(event) => setForm((prev) => ({ ...prev, addressZip: event.target.value }))}
                  placeholder="98101"
                  maxLength={20}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className={labelClass} htmlFor="employee-emergency-name">
                  Emergency contact name
                </label>
                <input
                  id="employee-emergency-name"
                  className={inputClass}
                  value={form.emergencyContactName}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, emergencyContactName: event.target.value }))
                  }
                  placeholder="Alex Pawsworth"
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="employee-emergency-phone">
                  Emergency contact phone
                </label>
                <input
                  id="employee-emergency-phone"
                  className={inputClass}
                  value={form.emergencyContactPhone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, emergencyContactPhone: event.target.value }))
                  }
                  placeholder="(555) 555-7890"
                />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-brand-navy">Role & responsibilities</h2>
              <p className="text-sm text-brand-navy/70">
                Pick a role template to learn what it includes. We&rsquo;ll pre-select the permissions below, and you can
                tweak them at any time.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {ROLE_TEMPLATES.map((template) => {
                const isSelected = selectedRoleId === template.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleRoleTemplateSelect(template)}
                    className={clsx(
                      "flex h-full flex-col rounded-2xl border px-4 py-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-brand-bubble/40",
                      isSelected
                        ? "border-brand-bubble bg-brand-bubble/10 ring-2 ring-brand-bubble/30"
                        : "border-white/50 bg-white/80 hover:border-brand-bubble/60 hover:shadow-md",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-semibold text-brand-navy">{template.label}</span>
                      {isSelected && (
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-bubble">Selected</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-brand-navy/70">{template.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {template.defaultPermissions.length > 0 ? (
                        template.defaultPermissions.map((permissionKey) => (
                          <span
                            key={permissionKey}
                            className="inline-flex items-center rounded-full bg-brand-bubble/15 px-2 py-1 text-xs font-semibold text-brand-navy"
                          >
                            {PERMISSION_LABEL_MAP[permissionKey]}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-brand-navy/5 px-2 py-1 text-xs font-semibold text-brand-navy/70">
                          No extra permissions
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-xs text-brand-navy/60">
                      {template.defaultPermissions.length > 0
                        ? "Selecting this will check those boxes for you."
                        : "Start with no additional access and turn on what you need."}
                    </p>
                  </button>
                );
              })}
              <button
                type="button"
                aria-pressed={selectedRoleId === CUSTOM_ROLE_ID}
                onClick={handleCustomRoleSelect}
                className={clsx(
                  "flex h-full flex-col rounded-2xl border px-4 py-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-brand-bubble/40",
                  selectedRoleId === CUSTOM_ROLE_ID
                    ? "border-brand-bubble bg-brand-bubble/10 ring-2 ring-brand-bubble/30"
                    : "border-dashed border-white/50 bg-white/60 hover:border-brand-bubble/60 hover:shadow-md",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-semibold text-brand-navy">Custom title</span>
                  {selectedRoleId === CUSTOM_ROLE_ID && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand-bubble">Selected</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-brand-navy/70">
                  Name the role yourself and toggle permissions manually.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-brand-navy/5 px-2 py-1 text-xs font-semibold text-brand-navy/70">
                    Flexible access
                  </span>
                  <span className="inline-flex items-center rounded-full bg-brand-navy/5 px-2 py-1 text-xs font-semibold text-brand-navy/70">
                    Your rules
                  </span>
                </div>
              </button>
            </div>
            {selectedRoleId === CUSTOM_ROLE_ID ? (
              <div className="space-y-1">
                <label className={labelClass} htmlFor="employee-role">
                  Role title
                </label>
                <input
                  id="employee-role"
                  className={inputClass}
                  value={form.role}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCustomRoleDraft(value);
                    setForm((prev) => ({ ...prev, role: value }));
                  }}
                  placeholder="e.g. Lead groomer"
                  required
                />
                <p className="text-xs text-brand-navy/60">
                  We&rsquo;ll keep whatever permissions you&rsquo;ve already selected below.
                </p>
              </div>
            ) : form.role ? (
              <p className="text-xs text-brand-navy/60">
                Title will be saved as <span className="font-semibold text-brand-navy">{form.role}</span>. Need something different?
                Choose <span className="font-semibold">Custom title</span>.
              </p>
            ) : null}
          </section>

          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-brand-navy">App permissions</h2>
              <p className="text-sm text-brand-navy/70">
                Choose which areas of the workspace this team member can access. Role templates above will pre-select the
                common access, and you can fine-tune anything here or later in their settings.
              </p>
            </div>
            <div className="rounded-2xl border border-brand-bubble/30 bg-brand-bubble/10 p-4">
              <div className="grid gap-3 md:grid-cols-2">
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

          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-brand-navy">Compensation</h2>
              <p className="text-sm text-brand-navy/70">
                Combine hourly pay, commission, guarantees, and team overrides to match how this team member earns.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/50 bg-white/80 p-4 shadow-inner">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-brand-navy">Commission on personal grooms</h3>
                    <p className="text-sm text-brand-navy/70">
                      Pay a percentage of every dog this staff member personally grooms.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-brand-navy">
                    <input
                      type="checkbox"
                      checked={compensationDraft.commission.enabled}
                      onChange={(event) => {
                        const enabled = event.target.checked;
                        setCompensationDraft((prev) => {
                          const nextGuarantee =
                            !enabled && prev.guarantee.payoutMode === "higher"
                              ? { ...prev.guarantee, payoutMode: "stacked" as const }
                              : prev.guarantee;
                          return {
                            ...prev,
                            commission: {
                              ...prev.commission,
                              enabled,
                            },
                            guarantee: nextGuarantee,
                          };
                        });
                      }}
                      className="h-4 w-4 rounded border-brand-bubble/50 text-brand-bubble focus:ring-brand-bubble/50"
                    />
                    <span>Enable</span>
                  </label>
                </div>
                {compensationDraft.commission.enabled && (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className={labelClass} htmlFor="comp-commission-rate">
                        Commission %
                      </label>
                      <input
                        id="comp-commission-rate"
                        className={inputClass}
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={compensationDraft.commission.rate}
                        onChange={(event) =>
                          setCompensationDraft((prev) => ({
                            ...prev,
                            commission: { ...prev.commission, rate: event.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/50 bg-white/80 p-4 shadow-inner">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-brand-navy">Hourly pay</h3>
                    <p className="text-sm text-brand-navy/70">
                      Guarantee an hourly base rate in addition to any other earnings.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-brand-navy">
                    <input
                      type="checkbox"
                      checked={compensationDraft.hourly.enabled}
                      onChange={(event) =>
                        setCompensationDraft((prev) => ({
                          ...prev,
                          hourly: {
                            ...prev.hourly,
                            enabled: event.target.checked,
                          },
                        }))
                      }
                      className="h-4 w-4 rounded border-brand-bubble/50 text-brand-bubble focus:ring-brand-bubble/50"
                    />
                    <span>Enable</span>
                  </label>
                </div>
                {compensationDraft.hourly.enabled && (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className={labelClass} htmlFor="comp-hourly-rate">
                        Hourly rate ($)
                      </label>
                      <input
                        id="comp-hourly-rate"
                        className={inputClass}
                        type="number"
                        min={0}
                        step="0.01"
                        value={compensationDraft.hourly.rate}
                        onChange={(event) =>
                          setCompensationDraft((prev) => ({
                            ...prev,
                            hourly: { ...prev.hourly, rate: event.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/50 bg-white/80 p-4 shadow-inner">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-brand-navy">Salary</h3>
                    <p className="text-sm text-brand-navy/70">
                      Track an annual salary amount for reporting and payroll exports.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-brand-navy">
                    <input
                      type="checkbox"
                      checked={compensationDraft.salary.enabled}
                      onChange={(event) =>
                        setCompensationDraft((prev) => ({
                          ...prev,
                          salary: {
                            ...prev.salary,
                            enabled: event.target.checked,
                          },
                        }))
                      }
                      className="h-4 w-4 rounded border-brand-bubble/50 text-brand-bubble focus:ring-brand-bubble/50"
                    />
                    <span>Enable</span>
                  </label>
                </div>
                {compensationDraft.salary.enabled && (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className={labelClass} htmlFor="comp-salary-rate">
                        Salary (annual $)
                      </label>
                      <input
                        id="comp-salary-rate"
                        className={inputClass}
                        type="number"
                        min={0}
                        step="0.01"
                        value={compensationDraft.salary.rate}
                        onChange={(event) =>
                          setCompensationDraft((prev) => ({
                            ...prev,
                            salary: { ...prev.salary, rate: event.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/50 bg-white/80 p-4 shadow-inner">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-brand-navy">Weekly guarantee vs. commission</h3>
                    <p className="text-sm text-brand-navy/70">
                      Guarantee pay per week and choose whether it&rsquo;s paid alongside their commission or whichever amount is
                      higher.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-brand-navy">
                    <input
                      type="checkbox"
                      checked={compensationDraft.guarantee.enabled}
                      onChange={(event) =>
                        setCompensationDraft((prev) => ({
                          ...prev,
                          guarantee: {
                            ...prev.guarantee,
                            enabled: event.target.checked,
                          },
                        }))
                      }
                      className="h-4 w-4 rounded border-brand-bubble/50 text-brand-bubble focus:ring-brand-bubble/50"
                    />
                    <span>Enable</span>
                  </label>
                </div>
                {compensationDraft.guarantee.enabled && (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className={labelClass} htmlFor="comp-guarantee-amount">
                        Weekly guarantee ($)
                      </label>
                      <input
                        id="comp-guarantee-amount"
                        className={inputClass}
                        type="number"
                        min={0}
                        step="0.01"
                        value={compensationDraft.guarantee.weeklyAmount}
                        onChange={(event) =>
                          setCompensationDraft((prev) => ({
                            ...prev,
                            guarantee: { ...prev.guarantee, weeklyAmount: event.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <span className={labelClass}>How should the guarantee pay out?</span>
                      <div className="space-y-2 rounded-xl border border-brand-bubble/30 bg-white/60 p-3">
                        <label className="flex items-start gap-2 text-sm text-brand-navy">
                          <input
                            type="radio"
                            name="guarantee-mode"
                            value="stacked"
                            checked={compensationDraft.guarantee.payoutMode === "stacked"}
                            onChange={() =>
                              setCompensationDraft((prev) => ({
                                ...prev,
                                guarantee: { ...prev.guarantee, payoutMode: "stacked" as const },
                              }))
                            }
                            className="mt-1 h-4 w-4 border-brand-bubble/50 text-brand-bubble focus:ring-brand-bubble/50"
                          />
                          <span>
                            <span className="font-semibold">Pay the weekly guarantee and their commission</span>
                            <span className="block text-xs text-brand-navy/70">
                              They receive both the guaranteed amount and whatever commission they earn.
                            </span>
                          </span>
                        </label>
                        <label
                          className={clsx(
                            "flex items-start gap-2 text-sm text-brand-navy",
                            !compensationDraft.commission.enabled && "opacity-60",
                          )}
                        >
                          <input
                            type="radio"
                            name="guarantee-mode"
                            value="higher"
                            checked={compensationDraft.guarantee.payoutMode === "higher"}
                            onChange={() =>
                              setCompensationDraft((prev) => ({
                                ...prev,
                                guarantee: { ...prev.guarantee, payoutMode: "higher" as const },
                              }))
                            }
                            disabled={!compensationDraft.commission.enabled}
                            className="mt-1 h-4 w-4 border-brand-bubble/50 text-brand-bubble focus:ring-brand-bubble/50 disabled:border-brand-bubble/30 disabled:text-brand-bubble/30"
                          />
                          <span>
                            <span className="font-semibold">Pay whichever amount is higher</span>
                            <span className="block text-xs text-brand-navy/70">
                              Compare their commission earnings to the guarantee and pay the larger amount.
                            </span>
                          </span>
                        </label>
                      </div>
                      {!compensationDraft.commission.enabled && (
                        <p className="text-xs text-brand-navy/70">
                          Enable a commission rate above to compare against the guarantee.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/50 bg-white/80 p-4 shadow-inner">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-brand-navy">Team overrides</h3>
                    <p className="text-sm text-brand-navy/70">
                      Pay them an extra share of the appointments completed by groomers they manage. This amount comes out of
                      the business share—the groomers below them keep their full commission.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-brand-navy">
                    <input
                      type="checkbox"
                      checked={compensationDraft.overridesEnabled}
                      onChange={(event) =>
                        setCompensationDraft((prev) => ({
                          ...prev,
                          overridesEnabled: event.target.checked,
                          overrides:
                            event.target.checked && prev.overrides.length === 0
                              ? [{ subordinateId: null, percentage: "" }]
                              : prev.overrides,
                        }))
                      }
                      className="h-4 w-4 rounded border-brand-bubble/50 text-brand-bubble focus:ring-brand-bubble/50"
                    />
                    <span>Enable</span>
                  </label>
                </div>
                {compensationDraft.overridesEnabled && (
                  <div className="mt-4 space-y-4">
                    {staffOptions.length === 0 && (
                      <p className="text-sm text-brand-navy/70">
                        Add additional staff members first to set up override relationships.
                      </p>
                    )}
                    {compensationDraft.overrides.map((entry, index) => (
                      <div key={`override-${index}`} className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <label className={labelClass} htmlFor={`override-groomer-${index}`}>
                            Team member
                          </label>
                          <select
                            id={`override-groomer-${index}`}
                            className={inputClass}
                            value={entry.subordinateId ?? ""}
                            onChange={(event) => {
                              const value = event.target.value;
                              setCompensationDraft((prev) => {
                                const next = [...prev.overrides];
                                next[index] = {
                                  ...next[index],
                                  subordinateId: value ? Number(value) : null,
                                };
                                return { ...prev, overrides: next };
                              });
                            }}
                          >
                            <option value="">Select a groomer</option>
                            {staffOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name ?? `Staff #${option.id}`}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className={labelClass} htmlFor={`override-percent-${index}`}>
                            Override % of appointment revenue
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              id={`override-percent-${index}`}
                              className={inputClass}
                              type="number"
                              min={0}
                              max={100}
                              step="0.1"
                              value={entry.percentage}
                              onChange={(event) =>
                                setCompensationDraft((prev) => {
                                  const next = [...prev.overrides];
                                  next[index] = {
                                    ...next[index],
                                    percentage: event.target.value,
                                  };
                                  return { ...prev, overrides: next };
                                })
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setCompensationDraft((prev) => ({
                                  ...prev,
                                  overrides: prev.overrides.filter((_, idx) => idx !== index),
                                }))
                              }
                              className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setCompensationDraft((prev) => ({
                          ...prev,
                          overrides: [...prev.overrides, { subordinateId: null, percentage: "" }],
                        }))
                      }
                      disabled={staffOptions.length === 0}
                      className="inline-flex items-center justify-center rounded-full border border-brand-bubble/40 px-4 py-2 text-sm font-semibold text-brand-navy transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Add override
                    </button>
                  </div>
                )}
              </div>
              {compensationPreview.hasConfiguration && (
                <div className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-inner">
                  <h4 className="text-sm font-semibold text-brand-navy">Pay summary</h4>
                  {compensationPreview.summary.length > 0 ? (
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-brand-navy">
                      {compensationPreview.summary.map((line, index) => (
                        <li key={`pay-summary-${index}`}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-brand-navy/70">
                      Enter rates above to preview how they’ll be paid.
                    </p>
                  )}
                </div>
              )}
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
              Staff can be edited later to fine-tune scheduling preferences and other profile details.
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
         