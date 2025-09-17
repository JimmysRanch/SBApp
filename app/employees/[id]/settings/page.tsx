"use client";

import { useMemo, useState } from "react";

import { useEmployeeDetail } from "../EmployeeDetailClient";
import {
  saveCompensationAction,
  saveManagerNotesAction,
  savePreferencesAction,
  saveProfileAction,
} from "./actions";

type PermissionKey = "can_view_reports" | "can_edit_schedule" | "can_manage_discounts" | "can_manage_staff";

type PermissionOption = {
  key: PermissionKey;
  label: string;
};

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
        if (key in base) {
          base[key as PermissionKey] = Boolean(value);
        }
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

  const disabled = !viewerCanEditStaff;

  const handleProfileSave = async () => {
    const result = await saveProfileAction(employee.id, profile);
    if (!result.success) {
      pushToast(result.error ?? "Failed to save profile", "error");
      return;
    }
    pushToast("Profile updated", "success");
  };

  const handleCompensationSave = async () => {
    const result = await saveCompensationAction(employee.id, {
      pay_type: compensation.pay_type,
      commission_rate: Number(compensation.commission_rate) || 0,
      hourly_rate: Number(compensation.hourly_rate) || 0,
      salary_rate: Number(compensation.salary_rate) || 0,
      app_permissions: compensation.app_permissions,
    });
    if (!result.success) {
      pushToast(result.error ?? "Failed to save compensation", "error");
      return;
    }
    pushToast("Compensation updated", "success");
  };

  const handlePreferencesSave = async () => {
    const result = await savePreferencesAction(employee.id, {
      preferred_breeds: preferences.preferred_breeds,
      not_accepted_breeds: preferences.not_accepted_breeds,
      specialties: preferences.specialties,
      weeklyTarget: Number(preferences.weekly_revenue_target) || null,
      dogsPerDay: Number(preferences.desired_dogs_per_day) || null,
    });
    if (!result.success) {
      pushToast(result.error ?? "Failed to save preferences", "error");
      return;
    }
    pushToast("Preferences updated", "success");
  };

  const handleNotesSave = async () => {
    const result = await saveManagerNotesAction(employee.id, notes);
    if (!result.success) {
      pushToast(result.error ?? "Failed to save notes", "error");
      return;
    }
    pushToast("Notes updated", "success");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-navy">Profile</h2>
            <p className="text-sm text-slate-500">Contact and status details for this staff member.</p>
          </div>
          <button
            type="button"
            onClick={handleProfileSave}
            disabled={disabled}
            className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save
          </button>
        </header>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField
            label="Name"
            value={profile.name}
            onChange={(value) => setProfile((prev) => ({ ...prev, name: value }))}
            disabled={disabled}
          />
          <TextField
            label="Role"
            value={profile.role}
            onChange={(value) => setProfile((prev) => ({ ...prev, role: value }))}
            disabled={disabled}
          />
          <TextField
            label="Email"
            value={profile.email}
            onChange={(value) => setProfile((prev) => ({ ...prev, email: value }))}
            disabled={disabled}
          />
          <TextField
            label="Phone"
            value={profile.phone}
            onChange={(value) => setProfile((prev) => ({ ...prev, phone: value }))}
            disabled={disabled}
          />
          <TextField
            label="Avatar URL"
            value={profile.avatar_url}
            onChange={(value) => setProfile((prev) => ({ ...prev, avatar_url: value }))}
            disabled={disabled}
          />
          <SelectField
            label="Status"
            value={profile.status}
            options={STATUS_OPTIONS}
            onChange={(value) => setProfile((prev) => ({ ...prev, status: value }))}
            disabled={disabled}
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField
            label="Street"
            value={profile.address_street}
            onChange={(value) => setProfile((prev) => ({ ...prev, address_street: value }))}
            disabled={disabled}
          />
          <TextField
            label="City"
            value={profile.address_city}
            onChange={(value) => setProfile((prev) => ({ ...prev, address_city: value }))}
            disabled={disabled}
          />
          <TextField
            label="State"
            value={profile.address_state}
            onChange={(value) => setProfile((prev) => ({ ...prev, address_state: value }))}
            disabled={disabled}
          />
          <TextField
            label="Zip"
            value={profile.address_zip}
            onChange={(value) => setProfile((prev) => ({ ...prev, address_zip: value }))}
            disabled={disabled}
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField
            label="Emergency Contact Name"
            value={profile.emergency_contact_name}
            onChange={(value) => setProfile((prev) => ({ ...prev, emergency_contact_name: value }))}
            disabled={disabled}
          />
          <TextField
            label="Emergency Contact Phone"
            value={profile.emergency_contact_phone}
            onChange={(value) => setProfile((prev) => ({ ...prev, emergency_contact_phone: value }))}
            disabled={disabled}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-navy">Compensation & Permissions</h2>
            <p className="text-sm text-slate-500">Control pay structures and access for this employee.</p>
          </div>
          <button
            type="button"
            onClick={handleCompensationSave}
            disabled={disabled}
            className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save
          </button>
        </header>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SelectField
            label="Pay type"
            value={compensation.pay_type}
            options={["hourly", "commission", "salary", "hybrid"]}
            onChange={(value) => setCompensation((prev) => ({ ...prev, pay_type: value }))}
            disabled={disabled}
          />
          <NumberField
            label="Commission %"
            value={Number(compensation.commission_rate ?? 0) * 100}
            onChange={(value) => setCompensation((prev) => ({ ...prev, commission_rate: value / 100 }))}
            disabled={disabled}
          />
          <NumberField
            label="Hourly rate"
            value={Number(compensation.hourly_rate ?? 0)}
            onChange={(value) => setCompensation((prev) => ({ ...prev, hourly_rate: value }))}
            disabled={disabled}
          />
          <NumberField
            label="Salary rate"
            value={Number(compensation.salary_rate ?? 0)}
            onChange={(value) => setCompensation((prev) => ({ ...prev, salary_rate: value }))}
            disabled={disabled}
          />
        </div>
        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">App permissions</div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {PERMISSION_OPTIONS.map((option) => (
              <label key={option.key} className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={compensation.app_permissions[option.key]}
                  onChange={(event) =>
                    setCompensation((prev) => ({
                      ...prev,
                      app_permissions: {
                        ...prev.app_permissions,
                        [option.key]: event.target.checked,
                      },
                    }))
                  }
                  disabled={disabled}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-navy">Preferences & Goals</h2>
            <p className="text-sm text-slate-500">Track favorite breeds, specialties, and performance goals.</p>
          </div>
          <button
            type="button"
            onClick={handlePreferencesSave}
            disabled={disabled}
            className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save
          </button>
        </header>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TagInput
            label="Preferred breeds"
            values={preferences.preferred_breeds}
            onChange={(values) => setPreferences((prev) => ({ ...prev, preferred_breeds: values }))}
            disabled={disabled}
            placeholder="Add breed"
          />
          <TagInput
            label="Not accepted breeds"
            values={preferences.not_accepted_breeds}
            onChange={(values) => setPreferences((prev) => ({ ...prev, not_accepted_breeds: values }))}
            disabled={disabled}
            placeholder="Add breed"
          />
        </div>
        <div className="mt-4">
          <TagInput
            label="Specialties"
            values={preferences.specialties}
            onChange={(values) => setPreferences((prev) => ({ ...prev, specialties: values }))}
            disabled={disabled}
            placeholder="Add specialty"
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <NumberField
            label="Weekly revenue target"
            value={Number(preferences.weekly_revenue_target ?? 0)}
            onChange={(value) => setPreferences((prev) => ({ ...prev, weekly_revenue_target: value }))}
            disabled={disabled}
          />
          <NumberField
            label="Desired dogs per day"
            value={Number(preferences.desired_dogs_per_day ?? 0)}
            onChange={(value) => setPreferences((prev) => ({ ...prev, desired_dogs_per_day: value }))}
            disabled={disabled}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-navy">Manager Notes</h2>
            <p className="text-sm text-slate-500">Private notes for leadership. Visible to managers only.</p>
          </div>
          <button
            type="button"
            onClick={handleNotesSave}
            disabled={disabled}
            className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save
          </button>
        </header>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={disabled}
          className="mt-4 h-40 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 disabled:bg-slate-100"
          placeholder="Add private notes for this staff member"
        />
      </section>
    </div>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function TextField({ label, value, onChange, disabled }: TextFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-600">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
      />
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

function SelectField({ label, value, options, onChange, disabled }: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-600">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

type NumberFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

function NumberField({ label, value, onChange, disabled }: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-600">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
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
          <span
            key={value}
            className="flex items-center gap-1 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue"
          >
            {value}
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(values.filter((item) => item !== value))}
                className="text-brand-blue/80 hover:text-brand-blue"
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
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
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
