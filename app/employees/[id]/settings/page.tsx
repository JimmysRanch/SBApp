"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { saveSettings } from "./server-actions";
import { supabase } from "@/supabase/client";

interface StaffSettingsProps {
  params: { id: string };
}

interface FormState {
  name: string;
  role: string;
  email: string;
  phone: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  pay_type: string;
  commission_rate: string;
  hourly_rate: string;
  desired_dogs_per_day: string;
  weekly_revenue_target: string;
}

interface EmployeeRow {
  name?: string | null;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_zip?: string | null;
  pay_type?: string | null;
  commission_rate?: number | null;
  hourly_rate?: number | null;
}

interface StaffGoalsRow {
  weekly_revenue_target?: number | null;
  desired_dogs_per_day?: number | null;
}

const defaultState: FormState = {
  name: "",
  role: "",
  email: "",
  phone: "",
  address_street: "",
  address_city: "",
  address_state: "",
  address_zip: "",
  pay_type: "",
  commission_rate: "",
  hourly_rate: "",
  desired_dogs_per_day: "",
  weekly_revenue_target: "",
};

export default function StaffSettings({ params }: StaffSettingsProps) {
  const staffId = params.id;
  const [form, setForm] = useState<FormState>(defaultState);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const employeeId = Number(staffId);
      const [employeeRes, goalsRes] = await Promise.all([
        supabase
          .from("employees")
          .select(
            "name, role, email, phone, address_street, address_city, address_state, address_zip, pay_type, commission_rate, hourly_rate",
          )
          .eq("id", employeeId)
          .maybeSingle(),
        supabase.from("staff_goals").select("weekly_revenue_target, desired_dogs_per_day").eq("staff_id", employeeId).maybeSingle(),
      ]);

      if (!active) {
        return;
      }

      const employee = (employeeRes.data ?? {}) as EmployeeRow;
      const goals = (goalsRes.data ?? {}) as StaffGoalsRow;

      setForm({
        name: employee.name ?? "",
        role: employee.role ?? "",
        email: employee.email ?? "",
        phone: employee.phone ?? "",
        address_street: employee.address_street ?? "",
        address_city: employee.address_city ?? "",
        address_state: employee.address_state ?? "",
        address_zip: employee.address_zip ?? "",
        pay_type: employee.pay_type ?? "",
        commission_rate: employee.commission_rate?.toString() ?? "",
        hourly_rate: employee.hourly_rate?.toString() ?? "",
        desired_dogs_per_day: goals.desired_dogs_per_day?.toString() ?? "",
        weekly_revenue_target: goals.weekly_revenue_target?.toString() ?? "",
      });

      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [staffId]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    const fd = new FormData(event.currentTarget);

    try {
      await saveSettings(fd);
      setStatus("Settings saved");
    } catch (error) {
      console.error(error);
      setStatus("Unable to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <input type="hidden" name="id" value={staffId} />
      <section className="rounded-xl border bg-white p-4">
        <h3 className="mb-2 font-semibold">Profile</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            className="border p-2"
            name="name"
            placeholder="Full name"
            value={form.name}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            className="border p-2"
            name="role"
            placeholder="Role"
            value={form.role}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            className="border p-2"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            className="border p-2"
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            className="border p-2"
            name="address_street"
            placeholder="Street"
            value={form.address_street}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            className="border p-2"
            name="address_city"
            placeholder="City"
            value={form.address_city}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            className="border p-2"
            name="address_state"
            placeholder="State"
            value={form.address_state}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            className="border p-2"
            name="address_zip"
            placeholder="Zip"
            value={form.address_zip}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h3 className="mb-2 font-semibold">Compensation &amp; Permissions</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            className="border p-2"
            name="pay_type"
            value={form.pay_type}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">Select pay type</option>
            <option value="hourly">Hourly</option>
            <option value="commission">Commission</option>
            <option value="salary">Salary</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <input
            className="border p-2"
            name="commission_rate"
            type="number"
            step="0.01"
            placeholder="Commission %"
            value={form.commission_rate}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            className="border p-2"
            name="hourly_rate"
            type="number"
            step="0.01"
            placeholder="Hourly $"
            value={form.hourly_rate}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h3 className="mb-2 font-semibold">Preferences &amp; Goals</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            className="border p-2"
            name="desired_dogs_per_day"
            type="number"
            placeholder="Dogs/day goal"
            value={form.desired_dogs_per_day}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            className="border p-2"
            name="weekly_revenue_target"
            type="number"
            step="0.01"
            placeholder="Weekly $ target"
            value={form.weekly_revenue_target}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-neutral-50"
          disabled={saving || loading}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {status && <span className="text-sm text-neutral-600">{status}</span>}
      </div>
    </form>
  );
}
