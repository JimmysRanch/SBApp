"use client";

import { useMemo, useState } from "react";
import { useEmployeeDetail } from "../EmployeeDetailClient";
import {
  saveCompensationAction,
  saveManagerNotesAction,
  savePreferencesAction,
  saveProfileAction,
} from "./actions";

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

const STATUS_OPTIONS = ["Active", "Inactive", "On leave"];

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

  const [profile, setProfile] = useState({
    name: employee.name ?? "",
    role: employee.role ?? "",
    email: employee.email ?? "",
    phone: employee.phone ?? "",
    avatar_url: employee.avatar_url ?? "",
    status: employee.status ?? (employee.active ? "Active" : "Inactive"),
    address_street: employee.address_street ?? "",
    address_city: employee.address_city ?? "",
    address_state: employee.address_state ?? "",
    address_zip: employee.address_zip ?? "",
    emergency_contact_name: employee.emergency_contact_name ?? "",
    emergency_contact_phone: employee.emergency_contact_phone ?? "",
  });

  const [compensation, setCompensation] = useState({
    pay_type: employee.pay_type ?? "hourly",
    commission_rate: employee.commission_rate ?? 0,
    hourly_rate: employee.hourly_rate ?? 0,
    salary_rate: employee.salary_rate ?? 0,
    app_permissions: permissionState,
  });

  const [preferences, setPreferences] = useState({
    preferred_breeds: [...(employee.preferred_breeds ?? [])],
    not_accepted_breeds: [...(employee.not_accepted_breeds ?? [])],
    specialties: [...(employee.specialties ?? [])],
    weekly_revenue_target: goals?.weekly_revenue_target ?? 0,
    desired_dogs_per_day: goals?.desired_dogs_per_day ?? 0,
  });

  const [notes, setNotes] = useState(employee.manager_notes ?? "");

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

  const beginEdit = (key: keyof typeof editing) => {
    if (!viewerCanEditStaff) {
      pushToast("You don't have permission to edit staff settings", "error");
      return;
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

  const persistCompensation = async (section: "comp" | "perms") => {
    setSaving((s) => ({ ...s, [section]: true }));
    const result = await saveCompensationAction(employee.id, {
      pay_type: compensation.pay_type,
      commission_rate: Number(compensation.commission_rate) || 0,
      hourly_rate: Number(compensation.hourly_rate) || 0,
      salary_rate: Number(compensation.salary_rate) || 0,
      app_permissions: compensation.app_permissions,
    });
    setSaving((s) => ({ ...s, [section]: false }));
    if (!result.success) {
      const errorMessage =
        section === "comp" ? "Failed to save compensation" : "Failed to save permissions";
      pushToast(result.error ?? errorMessage, "error");
      return;
    }
    setEditing((e) => ({ ...e, [section]: false }));
    pushToast(section === "comp" ? "Compensation updated" : "Permissions updated", "success");
  };

  const handleCompensationSave = () => {
    void persistCompensation("comp");
  };

  const handlePermissionsSave = () => {
    void persistCompensation("perms");
  };

  const handlePreferencesSave = async () => {
    setSaving((s) => ({ ...s, prefs: true }));
    const result = await savePreferencesAction(employee.id, {
      preferred_breeds: preferences.preferred_breeds,
      not_accepted_breeds: preferences.not_accepted_breeds,
      specialties: preferences.specialties,
      weeklyTarget: Number(preferences.weekly_revenue_target) || null,
      dogsPerDay: Number(preferences.desired_dogs_per_day) || null,
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
            onChange={(v) => setProfile((p) => ({ ...p, status: v }))} disabled={!editing.profile || saving.profile} />
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
          onSave={handlePermissionsSave}
        />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {PERMISSION_OPTIONS.map((option) => (
            <label key={option.key} className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={!!compensation.app_permissions[option.key]}
                onChange={(e) =>
                  setCompensation((prev) => ({
                    ...prev,
                    app_permissions: {
                      ...prev.app_permissions,
                      [option.key]: e.target.checked,
                    },
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
          onSave={handleCompensationSave}
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SelectField
            label="Pay type"
            value={compensation.pay_type}
            options={["hourly", "commission", "salary", "hybrid"]}
            onChange={(v) => setCompensation((p) => ({ ...p, pay_type: v }))}
            disabled={!editing.comp || saving.comp}
          />
          <NumberField
            label="Commission %"
            value={Number(compensation.commission_rate ?? 0) * 100}
            onChange={(v) => setCompensation((p) => ({ ...p, commission_rate: v / 100 }))}
            disabled={!editing.comp || saving.comp}
          />
          <NumberField
            label="Hourly rate"
            value={Number(compensation.hourly_rate ?? 0)}
            onChange={(v) => setCompensation((p) => ({ ...p, hourly_rate: v }))}
            disabled={!editing.comp || saving.comp}
          />
          <NumberField
            label="Salary rate"
            value={Number(compensation.salary_rate ?? 0)}
            onChange={(v) => setCompensation((p) => ({ ...p, salary_rate: v }))}
            disabled={!editing.comp || saving.comp}
          />
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
            value={Number(preferences.weekly_revenue_target ?? 0)}
            onChange={(v) => setPreferences((p) => ({ ...p, weekly_revenue_target: v }))}
            disabled={!editing.prefs || saving.prefs}
          />
          <NumberField
            label="Desired dogs per day"
            value={Number(preferences.desired_dogs_per_day ?? 0)}
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

type SelectFieldProps = { label: string; value: string; options: string[]; onChange: (v: string) => void; disabled?: boolean };
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

type NumberFieldProps = { label: string; value: number; onChange: (v: number) => void; disabled?: boolean };
function NumberField({ label, value, onChange, disabled }: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-600">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
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
    if (values.includes(trimmed)) {
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
