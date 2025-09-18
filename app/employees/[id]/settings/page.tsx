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

  const [notes, setNotes] = useState(em
