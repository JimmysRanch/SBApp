"use client";

import { useEffect, useMemo, useState } from "react";

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
  const { employee, goals, viewerCanEditStaff, pushToast, updateEmployee, updateGoals } = useEmployeeDetail();

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
    commission_rate:
      typeof employee.commission_rate === "number" && Number.isFinite(employee.commission_rate)
        ? employee.commission_rate
        : 0,
    hourly_rate:
      typeof employee.hourly_rate === "number" && Number.isFinite(employee.hourly_rate)
        ? employee.hourly_rate
        : 0,
    salary_rate:
      typeof employee.salary_rate === "number" && Number.isFinite(employee.salary_rate)
        ? employee.salary_rate
        : 0,
    app_permissions: permissionState,
  });

  const [preferences, setPreferences] = useState({
    preferred_breeds: Array.isArray(employee.preferred_breeds) ? [...employee.preferred_breeds] : [],
    not_accepted_breeds: Array.isArray(employee.not_accepted_breeds) ? [...employee.not_accepted_breeds] : [],
    specialties: Array.isArray(employee.specialties) ? [...employee.specialties] : [],
    weekly_revenue_target:
      typeof goals?.weekly_revenue_target === "number" && Number.isFinite(goals.weekly_revenue_target)
        ? Number(goals.weekly_revenue_target)
        : 0,
    desired_dogs_per_day:
      typeof goals?.desired_dogs_per_day === "number" && Number.isFinite(goals.desired_dogs_per_day)
        ? Number(goals.desired_dogs_per_day)
        : 0,
  });

  const [notes, setNotes] = useState(employee.manager_notes ?? "");

  const [editingProfile, setEditingProfile] = useState(false);
  const [editingCompensation, setEditingCompensation] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);

  const [profileSaving, setProfileSaving] = useState(false);
  const [compensationSaving, setCompensationSaving] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);

  const canEdit = viewerCanEditStaff;
  const readOnly = !canEdit;

  useEffect(() => {
    if (!editingProfile) {
      setProfile({
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
    }
  }, [employee, editingProfile]);

  useEffect(() => {
    if (!editingCompensation) {
      setCompensation({
        pay_type: employee.pay_type ?? "hourly",
        commission_rate:
          typeof employee.commission_rate === "number" && Number.isFinite(employee.commission_rate)
            ? employee.commission_rate
            : 0,
        hourly_rate:
          typeof employee.hourly_rate === "number" && Number.isFinite(employee.hourly_rate)
            ? employee.hourly_rate
            : 0,
        salary_rate:
          typeof employee.salary_rate === "number" && Number.isFinite(employee.salary_rate)
            ? employee.salary_rate
            : 0,
        app_permissions: { ...permissionState },
      });
    }
  }, [employee, permissionState, editingCompensation]);

  useEffect(() => {
    if (!editingPreferences) {
      setPreferences({
        preferred_breeds: Array.isArray(employee.preferred_breeds) ? [...employee.preferred_breeds] : [],
        not_accepted_breeds: Array.isArray(employee.not_accepted_breeds) ? [...employee.not_accepted_breeds] : [],
        specialties: Array.isArray(employee.specialties) ? [...employee.specialties] : [],
        weekly_revenue_target:
          typeof goals?.weekly_revenue_target === "number" && Number.isFinite(goals.weekly_revenue_target)
            ? Number(goals.weekly_revenue_target)
            : 0,
        desired_dogs_per_day:
          typeof goals?.desired_dogs_per_day === "number" && Number.isFinite(goals.desired_dogs_per_day)
            ? Number(goals.desired_dogs_per_day)
            : 0,
      });
    }
  }, [employee, goals, editingPreferences]);

  useEffect(() => {
    if (!editingNotes) {
      setNotes(employee.manager_notes ?? "");
    }
  }, [employee.manager_notes, editingNotes]);

  const toNullIfEmpty = (value: string) => {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  };

  const toNumberOrZero = (value: unknown) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const toNullableNumber = (value: unknown) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const handleProfileSave = async () => {
    if (!canEdit || profileSaving) return;
    setProfileSaving(true);
    const result = await saveProfileAction(employee.id, profile);
    if (!result.success) {
      pushToast(result.error ?? "Failed to save profile", "error");
      setProfileSaving(false);
      return;
    }
    const status = profile.status || "Active";
    updateEmployee({
      name: toNullIfEmpty(profile.name),
      role: toNullIfEmpty(profile.role),
      email: toNullIfEmpty(profile.email),
      phone: toNullIfEmpty(profile.phone),
      avatar_url: toNullIfEmpty(profile.avatar_url),
      status,
      active: status.toLowerCase().includes("active"),
      address_street: toNullIfEmpty(profile.address_street),
      address_city: toNullIfEmpty(profile.address_city),
      address_state: toNullIfEmpty(profile.address_state),
      address_zip: toNullIfEmpty(profile.address_zip),
      emergency_contact_name: toNullIfEmpty(profile.emergency_contact_name),
      emergency_contact_phone: toNullIfEmpty(profile.emergency_contact_phone),
    });
    pushToast("Profile updated", "success");
    setProfileSaving(false);
    setEditingProfile(false);
  };

  const handleProfileCancel = () => {
    setProfile({
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
    setEditingProfile(false);
  };

  const handleCompensationSave = async () => {
    if (!canEdit || compensationSaving) return;
    setCompensationSaving(true);
    const payload = {
      pay_type: compensation.pay_type,
      commission_rate: toNumberOrZero(compensation.commission_rate),
      hourly_rate: toNumberOrZero(compensation.hourly_rate),
      salary_rate: toNumberOrZero(compensation.salary_rate),
      app_permissions: compensation.app_permissions,
    };
    const result = await saveCompensationAction(employee.id, payload);
    if (!result.success) {
      pushToast(result.error ?? "Failed to save compensation", "error");
      setCompensationSaving(false);
      return;
    }
    updateEmployee({
      pay_type: payload.pay_type,
      commission_rate: payload.commission_rate,
      hourly_rate: payload.hourly_rate,
      salary_rate: payload.salary_rate,
      app_permissions: { ...payload.app_permissions },
    });
    pushToast("Compensation updated", "success");
    setCompensationSaving(false);
    setEditingCompensation(false);
  };

  const handleCompensationCancel = () => {
    setCompensation({
      pay_type: employee.pay_type ?? "hourly",
      commission_rate:
        typeof employee.commission_rate === "number" && Number.isFinite(employee.commission_rate)
          ? employee.commission_rate
          : 0,
      hourly_rate:
        typeof employee.hourly_rate === "number" && Number.isFinite(employee.hourly_rate)
          ? employee.hourly_rate
          : 0,
      salary_rate:
        typeof employee.salary_rate === "number" && Number.isFinite(employee.salary_rate)
          ? employee.salary_rate
          : 0,
      app_permissions: { ...permissionState },
    });
    setEditingCompensation(false);
  };

  const handlePreferencesSave = async () => {
    if (!canEdit || preferencesSaving) return;
    setPreferencesSaving(true);
    const payload = {
      preferred_breeds: [...preferences.preferred_breeds],
      not_accepted_breeds: [...preferences.not_accepted_breeds],
      specialties: [...preferences.specialties],
      weeklyTarget: toNullableNumber(preferences.weekly_revenue_target),
      dogsPerDay: toNullableNumber(preferences.desired_dogs_per_day),
    };
    const result = await savePreferencesAction(employee.id, payload);
    if (!result.success) {
      pushToast(result.error ?? "Failed to save preferences", "error");
      setPreferencesSaving(false);
      return;
    }
    updateEmployee({
      preferred_breeds: [...payload.preferred_breeds],
      not_accepted_breeds: [...payload.not_accepted_breeds],
      specialties: [...payload.specialties],
    });
    updateGoals({
      weekly_revenue_target: payload.weeklyTarget,
      desired_dogs_per_day: payload.dogsPerDay,
    });
    pushToast("Preferences updated", "success");
    setPreferencesSaving(false);
    setEditingPreferences(false);
  };

  const handlePreferencesCancel = () => {
    setPreferences({
      preferred_breeds: Array.isArray(employee.preferred_breeds) ? [...employee.preferred_breeds] : [],
      not_accepted_breeds: Array.isArray(employee.not_accepted_breeds) ? [...employee.not_accepted_breeds] : [],
      specialties: Array.isArray(employee.specialties) ? [...employee.specialties] : [],
      weekly_revenue_target:
        typeof goals?.weekly_revenue_target === "number" && Number.isFinite(goals.weekly_revenue_target)
          ? Number(goals.weekly_revenue_target)
          : 0,
      desired_dogs_per_day:
        typeof goals?.desired_dogs_per_day === "number" && Number.isFinite(goals.desired_dogs_per_day)
          ? Number(goals.desired_dogs_per_day)
          : 0,
    });
    setEditingPreferences(false);
  };

  const handleNotesSave = async () => {
    if (!canEdit || notesSaving) return;
    setNotesSaving(true);
    const result = await saveManagerNotesAction(employee.id, notes);
    if (!result.success) {
      pushToast(result.error ?? "Failed to save notes", "error");
      setNotesSaving(false);
      return;
    }
    const trimmed = notes.trim();
    updateEmployee({ manager_notes: trimmed ? trimmed : null });
    pushToast("Notes updated", "success");
    setNotesSaving(false);
    setEditingNotes(false);
  };

  const handleNotesCancel = () => {
    setNotes(employee.manager_notes ?? "");
    setEditingNotes(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-navy">Profile</h2>
            <p className="text-sm text-slate-500">Contact and status details for this staff member.</p>
          </div>
          {editingProfile ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleProfileCancel}
                disabled={profileSaving}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProfileSave}
                disabled={readOnly || profileSaving}
                className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {profileSaving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingProfile(true)}
              disabled={readOnly}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-blue hover:bg-brand-blue/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Edit
            </button>
          )}
        </header>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField
            label="Name"
            value={profile.name}
            onChange={(value) => setProfile((prev) => ({ ...prev, name: value }))}
            disabled={readOnly || !editingProfile}
          />
          <TextField
            label="Role"
            value={profile.role}
            onChange={(value) => setProfile((prev) => ({ ...prev, role: value }))}
            disabled={readOnly || !editingProfile}
          />
          <TextField
            label="Email"
            value={profile.email}
            onChange={(value) => setProfile((prev) => ({ ...prev, email: value }))}
            disabled={readOnly || !editingProfile}
          />
          <TextField
            label="Phone"
            value={profile.phone}
            onChange={(value) => setProfile((prev) => ({ ...prev, phone: value }))}
            disabled={readOnly || !editingProfile}
          />
          <TextField
            label="Avatar URL"
            value={profile.avatar_url}
            onChange={(value) => setProfile((prev) => ({ ...prev, avatar_url: value }))}
            disabled={readOnly || !editingProfile}
          />
          <SelectField
            label="Status"
            value={profile.status}
            options={STATUS_OPTIONS}
            onChange={(value) => setProfile((prev) => ({ ...prev, status: value }))}
            disabled={readOnly || !editingProfile}
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField
            label="Street"
            value={profile.address_street}
            onChange={(value) => setProfile((prev) => ({ ...prev, address_street: value }))}
            disabled={readOnly || !editingProfile}
          />
          <TextField
            label="City"
            value={profile.address_city}
            onChange={(value) => setProfile((prev) => ({ ...prev, address_city: value }))}
            disabled={readOnly || !editingProfile}
          />
          <TextField
            label="State"
            value={profile.address_state}
            onChange={(value) => setProfile((prev) => ({ ...prev, address_state: value }))}
            disabled={readOnly || !editingProfile}
          />
          <TextField
            label="Zip"
            value={profile.address_zip}
            onChange={(value) => setProfile((prev) => ({ ...prev, address_zip: value }))}
            disabled={readOnly || !editingProfile}
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField
            label="Emergency Contact Name"
            value={profile.emergency_contact_name}
            onChange={(value) => setProfile((prev) => ({ ...prev, emergency_contact_name: value }))}
            disabled={readOnly || !editingProfile}
          />
          <TextField
            label="Emergency Contact Phone"
            value={profile.emergency_contact_phone}
            onChange={(value) => setProfile((prev) => ({ ...prev, emergency_contact_phone: value }))}
            disabled={readOnly || !editingProfile}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-navy">Compensation & Permissions</h2>
            <p className="text-sm text-slate-500">Control pay structures and access for this employee.</p>
          </div>
          {editingCompensation ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCompensationCancel}
                disabled={compensationSaving}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompensationSave}
                disabled={readOnly || compensationSaving}
                className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {compensationSaving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingCompensation(true)}
              disabled={readOnly}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-blue hover:bg-brand-blue/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Edit
            </button>
          )}
        </header>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SelectField
            label="Pay type"
            value={compensation.pay_type}
            options={["hourly", "commission", "salary", "hybrid"]}
            onChange={(value) => setCompensation((prev) => ({ ...prev, pay_type: value }))}
            disabled={readOnly || !editingCompensation}
          />
          <NumberField
            label="Commission %"
            value={Number(compensation.commission_rate ?? 0) * 100}
            onChange={(value) => setCompensation((prev) => ({ ...prev, commission_rate: value / 100 }))}
            disabled={readOnly || !editingCompensation}
          />
          <NumberField
            label="Hourly rate"
            value={Number(compensation.hourly_rate ?? 0)}
            onChange={(value) => setCompensation((prev) => ({ ...prev, hourly_rate: value }))}
            disabled={readOnly || !editingCompensation}
          />
          <NumberField
            label="Salary rate"
            value={Number(compensation.salary_rate ?? 0)}
            onChange={(value) => setCompensation((prev) => ({ ...prev, salary_rate: value }))}
            disabled={readOnly || !editingCompensation}
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
                  disabled={readOnly || !editingCompensation}
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
          {editingPreferences ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePreferencesCancel}
                disabled={preferencesSaving}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePreferencesSave}
                disabled={readOnly || preferencesSaving}
                className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {preferencesSaving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingPreferences(true)}
              disabled={readOnly}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-blue hover:bg-brand-blue/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Edit
            </button>
          )}
        </header>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TagInput
            label="Preferred breeds"
            values={preferences.preferred_breeds}
            onChange={(values) => setPreferences((prev) => ({ ...prev, preferred_breeds: values }))}
            disabled={readOnly || !editingPreferences}
            placeholder="Add breed"
          />
          <TagInput
            label="Not accepted breeds"
            values={preferences.not_accepted_breeds}
            onChange={(values) => setPreferences((prev) => ({ ...prev, not_accepted_breeds: values }))}
            disabled={readOnly || !editingPreferences}
            placeholder="Add breed"
          />
        </div>
        <div className="mt-4">
          <TagInput
            label="Specialties"
            values={preferences.specialties}
            onChange={(values) => setPreferences((prev) => ({ ...prev, specialties: values }))}
            disabled={readOnly || !editingPreferences}
            placeholder="Add specialty"
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <NumberField
            label="Weekly revenue target"
            value={Number(preferences.weekly_revenue_target ?? 0)}
            onChange={(value) => setPreferences((prev) => ({ ...prev, weekly_revenue_target: value }))}
            disabled={readOnly || !editingPreferences}
          />
          <NumberField
            label="Desired dogs per day"
            value={Number(preferences.desired_dogs_per_day ?? 0)}
            onChange={(value) => setPreferences((prev) => ({ ...prev, desired_dogs_per_day: value }))}
            disabled={readOnly || !editingPreferences}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-navy">Manager Notes</h2>
            <p className="text-sm text-slate-500">Private notes for leadership. Visible to managers only.</p>
          </div>
          {editingNotes ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNotesCancel}
                disabled={notesSaving}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNotesSave}
                disabled={readOnly || notesSaving}
                className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {notesSaving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingNotes(true)}
              disabled={readOnly}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-blue hover:bg-brand-blue/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Edit
            </button>
          )}
        </header>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={readOnly || !editingNotes}
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
