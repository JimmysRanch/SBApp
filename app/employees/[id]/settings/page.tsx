"use client";

import clsx from "clsx";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useEmployeeDetail } from "../EmployeeDetailClient";
import {
  saveCompensationAction,
  saveManagerNotesAction,
  savePreferencesAction,
  saveProfileAction,
} from "./actions";
import {
  CompensationPlan,
  CompensationPlanDraft,
  draftFromPlan,
  derivePayType,
  getCommissionRate,
  getHourlyRate,
  getSalaryRate,
  parseDraft,
  planFromRecord,
  planHasConfiguration,
  planSummaryLines,
  toStoredPlan,
} from "@/lib/compensationPlan";
import { supabase } from "@/lib/supabase/client";
import {
  STAFF_STATUS_LABELS,
  cleanNullableText,
  normalizeStatusLabel,
  normalizeTagList,
  toOptionalNumber,
} from "@/lib/employees/profile";

type PermissionKey =
  | "can_view_reports"
  | "can_edit_schedule"
  | "can_manage_discounts"
  | "can_manage_staff";

type PermissionOption = { key: PermissionKey; label: string };

const PERMISSION_OPTIONS: PermissionOption[] = [
  { key: "can_view_reports", label: "View reports" },
  { key: "can_edit_schedule", label: "Edit schedule" },
  { key: "can_manage_discounts", label: "Manage discounts" },
  { key: "can_manage_staff", label: "Manage staff" },
];

const STATUS_OPTIONS = STAFF_STATUS_LABELS;

export default function EmployeeSettingsPage() {
  const { employee, goals, viewerCanEditStaff, pushToast } = useEmployeeDetail();

  const permissionState = useMemo(() => {
    const base: Record<PermissionKey, boolean> = {
      can_view_reports: false,
      can_edit_schedule: false,
      can_manage_discounts: false,
      can_manage_staff: false,
    };
    if (employee.app_permissions && typeof employee.app_permissions === "object") {
      Object.entries(employee.app_permissions).forEach(([key, value]) => {
        if (key in base) base[key as PermissionKey] = Boolean(value);
      });
    }
    return base;
  }, [employee.app_permissions]);

  const [profile, setProfile] = useState(() => {
    const { status } = normalizeStatusLabel(
      employee.status ?? (employee.active ? "Active" : "Inactive"),
    );
    return {
      name: cleanNullableText(employee.name) ?? "",
      role: cleanNullableText(employee.role) ?? "",
      email: cleanNullableText(employee.email) ?? "",
      phone: cleanNullableText(employee.phone) ?? "",
      avatar_url: cleanNullableText(employee.avatar_url) ?? "",
      status,
      address_street: cleanNullableText(employee.address_street) ?? "",
      address_city: cleanNullableText(employee.address_city) ?? "",
      address_state: cleanNullableText(employee.address_state) ?? "",
      address_zip: cleanNullableText(employee.address_zip) ?? "",
      emergency_contact_name: cleanNullableText(employee.emergency_contact_name) ?? "",
      emergency_contact_phone: cleanNullableText(employee.emergency_contact_phone) ?? "",
    };
  });

  const {
    compensation_plan: employeeCompensationPlan,
    commission_rate: employeeCommissionRate,
    hourly_rate: employeeHourlyRate,
    salary_rate: employeeSalaryRate,
    pay_type: employeePayType,
  } = employee;

  const initialPlan = useMemo(
    () =>
      toStoredPlan(
        planFromRecord({
          compensation_plan: employeeCompensationPlan,
          commission_rate: employeeCommissionRate,
          hourly_rate: employeeHourlyRate,
          salary_rate: employeeSalaryRate,
          pay_type: employeePayType,
        }),
      ),
    [
      employeeCompensationPlan,
      employeeCommissionRate,
      employeeHourlyRate,
      employeeSalaryRate,
      employeePayType,
    ],
  );

  const [currentPlan, setCurrentPlan] = useState<CompensationPlan>(initialPlan);
  const [compensationDraft, setCompensationDraft] = useState<CompensationPlanDraft>(() => draftFromPlan(initialPlan));
  const [appPermissions, setAppPermissions] = useState(permissionState);
  const [staffOptions, setStaffOptions] = useState<{ id: number; name: string | null }[]>([]);

  const [preferences, setPreferences] = useState(() => ({
    preferred_breeds: normalizeTagList(employee.preferred_breeds),
    not_accepted_breeds: normalizeTagList(employee.not_accepted_breeds),
    specialties: normalizeTagList(employee.specialties),
    weekly_revenue_target: toOptionalNumber(goals?.weekly_revenue_target),
    desired_dogs_per_day: toOptionalNumber(goals?.desired_dogs_per_day),
  }));

  const [notes, setNotes] = useState(cleanNullableText(employee.manager_notes) ?? "");

  const [editing, setEditing] = useState({
    profile: false,
    comp: false,
    perms: false,
    prefs: false,
    notes: false,
  });

  const [saving, setSaving] = useState({
    profile: false,
    comp: false,
    perms: false,
    prefs: false,
    notes: false,
  });

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

  useEffect(() => {
    if (editing.profile) return;
    const { status } = normalizeStatusLabel(
      employee.status ?? (employee.active ? "Active" : "Inactive"),
    );
    setProfile({
      name: cleanNullableText(employee.name) ?? "",
      role: cleanNullableText(employee.role) ?? "",
      email: cleanNullableText(employee.email) ?? "",
      phone: cleanNullableText(employee.phone) ?? "",
      avatar_url: cleanNullableText(employee.avatar_url) ?? "",
      status,
      address_street: cleanNullableText(employee.address_street) ?? "",
      address_city: cleanNullableText(employee.address_city) ?? "",
      address_state: cleanNullableText(employee.address_state) ?? "",
      address_zip: cleanNullableText(employee.address_zip) ?? "",
      emergency_contact_name: cleanNullableText(employee.emergency_contact_name) ?? "",
      emergency_contact_phone: cleanNullableText(employee.emergency_contact_phone) ?? "",
    });
  }, [
    editing.profile,
    employee.active,
    employee.address_city,
    employee.address_state,
    employee.address_street,
    employee.address_zip,
    employee.avatar_url,
    employee.email,
    employee.emergency_contact_name,
    employee.emergency_contact_phone,
    employee.name,
    employee.phone,
    employee.role,
    employee.status,
  ]);

  useEffect(() => {
    if (editing.prefs) return;
    setPreferences({
      preferred_breeds: normalizeTagList(employee.preferred_breeds),
      not_accepted_breeds: normalizeTagList(employee.not_accepted_breeds),
      specialties: normalizeTagList(employee.specialties),
      weekly_revenue_target: toOptionalNumber(goals?.weekly_revenue_target),
      desired_dogs_per_day: toOptionalNumber(goals?.desired_dogs_per_day),
    });
  }, [
    editing.prefs,
    employee.not_accepted_breeds,
    employee.preferred_breeds,
    employee.specialties,
    goals?.desired_dogs_per_day,
    goals?.weekly_revenue_target,
  ]);

  useEffect(() => {
    if (editing.notes) return;
    setNotes(cleanNullableText(employee.manager_notes) ?? "");
  }, [editing.notes, employee.manager_notes]);

  useEffect(() => {
    setEditing({ profile: false, comp: false, perms: false, prefs: false, notes: false });
    setSaving({ profile: false, comp: false, perms: false, prefs: false, notes: false });
  }, [employee.id]);

  useEffect(() => {
    setAppPermissions(permissionState);
  }, [permissionState]);

  useEffect(() => {
    if (!editing.comp) {
      setCurrentPlan(initialPlan);
      setCompensationDraft(draftFromPlan(initialPlan));
    }
  }, [initialPlan, editing.comp]);

  useEffect(() => {
    let active = true;
    const loadStaffOptions = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id,name")
        .order("name", { ascending: true });
      if (!active) return;
      if (error) {
        console.error("Failed to load staff list", error);
        setStaffOptions([]);
        return;
      }
      const rows = (data as { id: number; name: string | null }[]) ?? [];
      setStaffOptions(rows.filter((row) => row.id !== employee.id));
    };
    void loadStaffOptions();
    return () => {
      active = false;
    };
  }, [employee.id]);

  const beginEdit = (key: keyof typeof editing) => {
    if (!viewerCanEditStaff) {
      pushToast("You don't have permission to edit staff settings", "error");
      return;
    }
    if (key === "comp") {
      setCompensationDraft(draftFromPlan(currentPlan));
    }
    if (key === "perms") {
      setAppPermissions(permissionState);
    }
    setEditing((e) => ({ ...e, [key]: true }));
  };

  const handleProfileSave = async () => {
    setSaving((s) => ({ ...s, profile: true }));
    const result = await saveProfileAction(employee.id, profile);
    setSaving((s) => ({ ...s, profile: false }));
    if (!result.success) {
      pushToast(result.error ?? "Failed to save profile", "error");
      return;
    }
    setEditing((e) => ({ ...e, profile: false }));
    pushToast("Profile updated", "success");
  };

  const savePlanAndPermissions = async (
    plan: CompensationPlan,
    permissions: Record<string, boolean>,
    section: "comp" | "perms",
  ) => {
    setSaving((s) => ({ ...s, [section]: true }));
    const storedPlan = toStoredPlan(plan);
    const result = await saveCompensationAction(employee.id, {
      pay_type: derivePayType(storedPlan),
      commission_rate: getCommissionRate(storedPlan),
      hourly_rate: getHourlyRate(storedPlan),
      salary_rate: getSalaryRate(storedPlan),
      compensation_plan: storedPlan,
      app_permissions: permissions,
    });
    setSaving((s) => ({ ...s, [section]: false }));
    if (!result.success) {
      const errorMessage =
        section === "comp" ? "Failed to save compensation" : "Failed to save permissions";
      pushToast(result.error ?? errorMessage, "error");
      return false;
    }
    setEditing((e) => ({ ...e, [section]: false }));
    pushToast(section === "comp" ? "Compensation updated" : "Permissions updated", "success");
    return true;
  };

  const handleCompensationSave = async () => {
    const draftResult = parseDraft(compensationDraft);
    if (draftResult.errors.length > 0) {
      pushToast(draftResult.errors.join(" "), "error");
      return;
    }
    const success = await savePlanAndPermissions(draftResult.plan, appPermissions, "comp");
    if (success) {
      setCurrentPlan(draftResult.plan);
      setCompensationDraft(draftFromPlan(draftResult.plan));
    }
  };

  const handlePermissionsSave = async () => {
    await savePlanAndPermissions(currentPlan, appPermissions, "perms");
  };

  const handlePreferencesSave = async () => {
    setSaving((s) => ({ ...s, prefs: true }));
    const result = await savePreferencesAction(employee.id, {
      preferred_breeds: normalizeTagList(preferences.preferred_breeds),
      not_accepted_breeds: normalizeTagList(preferences.not_accepted_breeds),
      specialties: normalizeTagList(preferences.specialties),
      weeklyTarget: toOptionalNumber(preferences.weekly_revenue_target),
      dogsPerDay: toOptionalNumber(preferences.desired_dogs_per_day),
    });
    setSaving((s) => ({ ...s, prefs: false }));
    if (!result.success) {
      pushToast(result.error ?? "Failed to save preferences", "error");
      return;
    }
    setEditing((e) => ({ ...e, prefs: false }));
    pushToast("Preferences updated", "success");
  };

  const handleNotesSave = async () => {
    setSaving((s) => ({ ...s, notes: true }));
    const result = await saveManagerNotesAction(employee.id, notes);
    setSaving((s) => ({ ...s, notes: false }));
    if (!result.success) {
      pushToast(result.error ?? "Failed to save notes", "error");
      return;
    }
    setEditing((e) => ({ ...e, notes: false }));
    pushToast("Notes updated", "success");
  };

  return (
    <div className="space-y-6">
      {/* Profile */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Profile"
          subtitle="Contact and status details for this staff member."
          isEditing={editing.profile}
          isSaving={saving.profile}
          onEdit={() => beginEdit("profile")}
          onSave={handleProfileSave}
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField label="Name" value={profile.name} onChange={(v) => setProfile((p) => ({ ...p, name: v }))}
            disabled={!editing.profile || saving.profile} />
          <TextField label="Role" value={profile.role} onChange={(v) => setProfile((p) => ({ ...p, role: v }))}
            disabled={!editing.profile || saving.profile} />
          <TextField label="Email" value={profile.email} onChange={(v) => setProfile((p) => ({ ...p, email: v }))}
            disabled={!editing.profile || saving.profile} />
          <TextField label="Phone" value={profile.phone} onChange={(v) => setProfile((p) => ({ ...p, phone: v }))}
            disabled={!editing.profile || saving.profile} />
          <TextField label="Avatar URL" value={profile.avatar_url} onChange={(v) => setProfile((p) => ({ ...p, avatar_url: v }))}
            disabled={!editing.profile || saving.profile} />
          <SelectField label="Status" value={profile.status} options={STATUS_OPTIONS}
            onChange={(v) =>
              setProfile((p) => ({ ...p, status: normalizeStatusLabel(v).status }))
            }
            disabled={!editing.profile || saving.profile}
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField label="Street" value={profile.address_street}
            onChange={(v) => setProfile((p) => ({ ...p, address_street: v }))} disabled={!editing.profile || saving.profile} />
          <TextField label="City" value={profile.address_city}
            onChange={(v) => setProfile((p) => ({ ...p, address_city: v }))} disabled={!editing.profile || saving.profile} />
          <TextField label="State" value={profile.address_state}
            onChange={(v) => setProfile((p) => ({ ...p, address_state: v }))} disabled={!editing.profile || saving.profile} />
          <TextField label="Zip" value={profile.address_zip}
            onChange={(v) => setProfile((p) => ({ ...p, address_zip: v }))} disabled={!editing.profile || saving.profile} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField label="Emergency Contact Name" value={profile.emergency_contact_name}
            onChange={(v) => setProfile((p) => ({ ...p, emergency_contact_name: v }))} disabled={!editing.profile || saving.profile} />
          <TextField label="Emergency Contact Phone" value={profile.emergency_contact_phone}
            onChange={(v) => setProfile((p) => ({ ...p, emergency_contact_phone: v }))} disabled={!editing.profile || saving.profile} />
        </div>
      </section>

      {/* App permissions */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="App Permissions"
          subtitle="Choose which parts of Scruffy Butts this employee can manage."
          isEditing={editing.perms}
          isSaving={saving.perms}
          onEdit={() => beginEdit("perms")}
          onSave={() => {
            void handlePermissionsSave();
          }}
        />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {PERMISSION_OPTIONS.map((option) => (
            <label key={option.key} className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={!!appPermissions[option.key]}
                onChange={(e) =>
                  setAppPermissions((prev) => ({
                    ...prev,
                    [option.key]: e.target.checked,
                  }))
                }
                disabled={!editing.perms || saving.perms}
              />
              {option.label}
            </label>
          ))}
        </div>
      </section>

      {/* Compensation */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Compensation"
          subtitle="Control pay structures for this employee."
          isEditing={editing.comp}
          isSaving={saving.comp}
          onEdit={() => beginEdit("comp")}
          onSave={() => {
            void handleCompensationSave();
          }}
        />
        <div className="mt-4 space-y-4">
          <CompensationCard
            title="Commission on personal grooms"
            description="Pay a percentage of every dog this employee personally grooms."
            enabled={compensationDraft.commission.enabled}
            onToggle={(next) =>
              setCompensationDraft((prev) => {
                const nextGuarantee =
                  !next && prev.guarantee.payoutMode === "higher"
                    ? { ...prev.guarantee, payoutMode: "stacked" as const }
                    : prev.guarantee;
                return {
                  ...prev,
                  commission: {
                    ...prev.commission,
                    enabled: next,
                  },
                  guarantee: nextGuarantee,
                };
              })
            }
            disabled={!editing.comp || saving.comp}
          >
            {compensationDraft.commission.enabled && (
              <div className="grid gap-3 md:grid-cols-2">
                <FieldGroup label="Commission %">
                  <input
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
                    disabled={!editing.comp || saving.comp}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:bg-slate-100"
                  />
                </FieldGroup>
              </div>
            )}
          </CompensationCard>

          <CompensationCard
            title="Hourly pay"
            description="Guarantee an hourly base rate alongside other earnings."
            enabled={compensationDraft.hourly.enabled}
            onToggle={(next) =>
              setCompensationDraft((prev) => ({
                ...prev,
                hourly: {
                  ...prev.hourly,
                  enabled: next,
                },
              }))
            }
            disabled={!editing.comp || saving.comp}
          >
            {compensationDraft.hourly.enabled && (
              <div className="grid gap-3 md:grid-cols-2">
                <FieldGroup label="Hourly rate ($)">
                  <input
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
                    disabled={!editing.comp || saving.comp}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:bg-slate-100"
                  />
                </FieldGroup>
              </div>
            )}
          </CompensationCard>

          <CompensationCard
            title="Salary"
            description="Track an annual salary amount for reporting."
            enabled={compensationDraft.salary.enabled}
            onToggle={(next) =>
              setCompensationDraft((prev) => ({
                ...prev,
                salary: {
                  ...prev.salary,
                  enabled: next,
                },
              }))
            }
            disabled={!editing.comp || saving.comp}
          >
            {compensationDraft.salary.enabled && (
              <div className="grid gap-3 md:grid-cols-2">
                <FieldGroup label="Salary (annual $)">
                  <input
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
                    disabled={!editing.comp || saving.comp}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:bg-slate-100"
                  />
                </FieldGroup>
              </div>
            )}
          </CompensationCard>

          <CompensationCard
            title="Weekly guarantee vs. commission"
            description="Guarantee pay per week and choose whether it&rsquo;s paid alongside their commission or whichever amount is higher."
            enabled={compensationDraft.guarantee.enabled}
            onToggle={(next) =>
              setCompensationDraft((prev) => ({
                ...prev,
                guarantee: {
                  ...prev.guarantee,
                  enabled: next,
                },
              }))
            }
            disabled={!editing.comp || saving.comp}
          >
            {compensationDraft.guarantee.enabled && (
              <div className="grid gap-3 md:grid-cols-2">
                <FieldGroup label="Weekly guarantee ($)">
                  <input
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
                    disabled={!editing.comp || saving.comp}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:bg-slate-100"
                  />
                </FieldGroup>
                <FieldGroup label="How should the guarantee pay out?">
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                    <label className="flex items-start gap-2 text-sm text-slate-600">
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
                        disabled={!editing.comp || saving.comp}
                        className="mt-1 h-4 w-4 border-slate-300 text-brand-blue focus:ring-brand-blue/40 disabled:border-slate-200 disabled:text-slate-300"
                      />
                      <span>
                        <span className="font-semibold text-slate-700">Pay the weekly guarantee and their commission</span>
                        <span className="block text-xs text-slate-500">
                          They receive both the guaranteed amount and whatever commission they earn.
                        </span>
                      </span>
                    </label>
                    <label
                      className={clsx(
                        "flex items-start gap-2 text-sm text-slate-600",
                        (!compensationDraft.commission.enabled || !editing.comp || saving.comp) && "opacity-60",
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
                        disabled={!compensationDraft.commission.enabled || !editing.comp || saving.comp}
                        className="mt-1 h-4 w-4 border-slate-300 text-brand-blue focus:ring-brand-blue/40 disabled:border-slate-200 disabled:text-slate-300"
                      />
                      <span>
                        <span className="font-semibold text-slate-700">Pay whichever amount is higher</span>
                        <span className="block text-xs text-slate-500">
                          Compare their commission earnings to the guarantee and pay the larger amount.
                        </span>
                      </span>
                    </label>
                  </div>
                  {!compensationDraft.commission.enabled && (
                    <p className="text-xs text-slate-500">
                      Enable a commission rate above to compare against the guarantee.
                    </p>
                  )}
                </FieldGroup>
              </div>
            )}
          </CompensationCard>

          <CompensationCard
            title="Team overrides"
            description="Pay them an extra share of the appointments completed by groomers they manage. This amount comes out of the business share so the groomers below them keep their full commission."
            enabled={compensationDraft.overridesEnabled}
            onToggle={(next) =>
              setCompensationDraft((prev) => ({
                ...prev,
                overridesEnabled: next,
                overrides:
                  next && prev.overrides.length === 0
                    ? [{ subordinateId: null, percentage: "" }]
                    : prev.overrides,
              }))
            }
            disabled={!editing.comp || saving.comp}
          >
            {compensationDraft.overridesEnabled && (
              <div className="space-y-3">
                {staffOptions.length === 0 && (
                  <p className="text-xs text-slate-500">
                    Add more staff members to assign override relationships.
                  </p>
                )}
                {compensationDraft.overrides.map((entry, index) => (
                  <div key={`override-${index}`} className="grid gap-3 md:grid-cols-2">
                    <FieldGroup label="Team member">
                      <select
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
                        disabled={!editing.comp || saving.comp}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:bg-slate-100"
                      >
                        <option value="">Select a groomer</option>
                        {staffOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name ?? `Staff #${option.id}`}
                          </option>
                        ))}
                      </select>
                    </FieldGroup>
                    <FieldGroup label="Override % of appointment revenue">
                      <div className="flex items-center gap-2">
                        <input
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
                          disabled={!editing.comp || saving.comp}
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:bg-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setCompensationDraft((prev) => ({
                              ...prev,
                              overrides: prev.overrides.filter((_, idx) => idx !== index),
                            }))
                          }
                          disabled={!editing.comp || saving.comp}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                    </FieldGroup>
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
                  disabled={!editing.comp || saving.comp || staffOptions.length === 0}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Add override
                </button>
              </div>
            )}
          </CompensationCard>
          {compensationPreview.hasConfiguration && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-sm font-semibold text-slate-700">Pay summary</h4>
              {compensationPreview.summary.length > 0 ? (
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
                  {compensationPreview.summary.map((line, index) => (
                    <li key={`pay-summary-${index}`}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Enter rates above to preview how they’ll be paid.</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Preferences */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Preferences & Goals"
          subtitle="Track favorite breeds, specialties, and performance goals."
          isEditing={editing.prefs}
          isSaving={saving.prefs}
          onEdit={() => beginEdit("prefs")}
          onSave={handlePreferencesSave}
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TagInput
            label="Preferred breeds"
            values={preferences.preferred_breeds}
            onChange={(vals) => setPreferences((p) => ({ ...p, preferred_breeds: vals }))}
            disabled={!editing.prefs || saving.prefs}
            placeholder="Add breed"
          />
          <TagInput
            label="Not accepted breeds"
            values={preferences.not_accepted_breeds}
            onChange={(vals) => setPreferences((p) => ({ ...p, not_accepted_breeds: vals }))}
            disabled={!editing.prefs || saving.prefs}
            placeholder="Add breed"
          />
        </div>
        <div className="mt-4">
          <TagInput
            label="Specialties"
            values={preferences.specialties}
            onChange={(vals) => setPreferences((p) => ({ ...p, specialties: vals }))}
            disabled={!editing.prefs || saving.prefs}
            placeholder="Add specialty"
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <NumberField
            label="Weekly revenue target"
            value={preferences.weekly_revenue_target}
            onChange={(v) => setPreferences((p) => ({ ...p, weekly_revenue_target: v }))}
            disabled={!editing.prefs || saving.prefs}
          />
          <NumberField
            label="Desired dogs per day"
            value={preferences.desired_dogs_per_day}
            onChange={(v) => setPreferences((p) => ({ ...p, desired_dogs_per_day: v }))}
            disabled={!editing.prefs || saving.prefs}
          />
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Manager Notes"
          subtitle="Private notes for leadership. Visible to managers only."
          isEditing={editing.notes}
          isSaving={saving.notes}
          onEdit={() => beginEdit("notes")}
          onSave={handleNotesSave}
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={!editing.notes || saving.notes}
          className="mt-4 h-40 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 disabled:bg-slate-100"
          placeholder="Add private notes for this staff member"
        />
      </section>
    </div>
  );
}

type CompensationCardProps = {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
  children?: ReactNode;
};

function CompensationCard({ title, description, enabled, onToggle, disabled, children }: CompensationCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => onToggle(event.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue/40 disabled:cursor-not-allowed"
          />
          <span>Enable</span>
        </label>
      </div>
      {children && <div className="mt-3 space-y-3 text-sm text-slate-600">{children}</div>}
    </div>
  );
}

type FieldGroupProps = { label: string; children: ReactNode };

function FieldGroup({ label, children }: FieldGroupProps) {
  return (
    <div className="flex flex-col gap-1 text-sm text-slate-600">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </div>
  );
}

/** Header that always allows clicking Edit. Save is the same button. */
function SectionHeader(props: {
  title: string;
  subtitle: string;
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
}) {
  const { title, subtitle, isEditing, isSaving, onEdit, onSave } = props;
  const label = isSaving ? "Saving…" : isEditing ? "Save" : "Edit";
  const handler = isEditing ? onSave : onEdit;
  return (
    <header className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-brand-navy">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={handler}
        disabled={isSaving}
        className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {label}
      </button>
    </header>
  );
}

type TextFieldProps = { label: string; value: string; onChange: (v: string) => void; disabled?: boolean };
function TextField({ label, value, onChange, disabled }: TextFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-600">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
      />
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  disabled?: boolean;
};
function SelectField({ label, value, options, onChange, disabled }: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-600">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

type NumberFieldProps = {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  disabled?: boolean;
};
function NumberField({ label, value, onChange, disabled }: NumberFieldProps) {
  const displayValue =
    typeof value === "number" && Number.isFinite(value) ? value : "";
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-600">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type="number"
        value={displayValue}
        onChange={(e) => {
          const next = e.target.value;
          if (next === "") {
            onChange(null);
            return;
          }
          const numeric = Number(next);
          onChange(Number.isFinite(numeric) ? numeric : null);
        }}
        disabled={disabled}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
      />
    </label>
  );
}

type TagInputProps = {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
};

function TagInput({ label, values, onChange, placeholder, disabled }: TagInputProps) {
  const [input, setInput] = useState("");

  const addValue = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const normalized = trimmed.toLowerCase();
    if (values.some((value) => value.toLowerCase() === normalized)) {
      setInput("");
      return;
    }
    onChange([...values, trimmed]);
    setInput("");
  };

  return (
    <div className="flex flex-col gap-2 text-sm text-slate-600">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span key={value} className="flex items-center gap-1 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue">
            {value}
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(values.filter((item) => item !== value))}
                className="text-brand-blue/80 hover:text-brand-blue"
                aria-label={`Remove ${value}`}
                title="Remove"
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addValue();
          }
        }}
        disabled={disabled}
        placeholder={placeholder}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
      />
      {!disabled && (
        <button
          type="button"
          onClick={addValue}
          className="self-start rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-brand-blue hover:bg-slate-100"
        >
          Add
        </button>
      )}
    </div>
  );
}
