"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import { supabase } from "@/supabase/client";

interface FormValues {
  name: string;
  phone: string;
  email: string;
  active: boolean;
}

const initialForm: FormValues = {
  name: "",
  phone: "",
  email: "",
  active: true,
};

const toNullable = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export default function NewEmployeePage() {
  const router = useRouter();
  const [formValues, setFormValues] = useState<FormValues>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleActiveChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    setFormValues((prev) => ({ ...prev, active: checked }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedName = formValues.name.trim();
    if (!trimmedName) {
      setError("An employee name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        phone: toNullable(formValues.phone),
        email: toNullable(formValues.email),
        active: formValues.active,
      };

      const { data, error: insertError } = await supabase
        .from("employees")
        .insert([payload])
        .select("id")
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSubmitting(false);
      if (data?.id) {
        router.push(`/employees/${data.id}`);
      } else {
        router.push("/employees");
      }
    } catch (err) {
      setSubmitting(false);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Something went wrong while creating the employee.";
      setError(message);
    }
  };

  return (
    <PageContainer>
      <Card className="max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold text-primary-dark">Add New Employee</h1>
        <p className="mb-6 text-sm text-gray-600">
          Add the basic contact information for your new team member. You can update
          additional details like pay rates and scheduling after the profile is created.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="name" className="mb-1 block text-sm font-semibold text-primary-dark">
                Full Name<span className="ml-0.5 text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                value={formValues.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                autoComplete="name"
                className="w-full rounded-2xl border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-semibold text-primary-dark">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formValues.email}
                onChange={handleChange}
                placeholder="jane@example.com"
                autoComplete="email"
                className="w-full rounded-2xl border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-primary-dark">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formValues.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                autoComplete="tel"
                className="w-full rounded-2xl border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="active" className="mb-1 block text-sm font-semibold text-primary-dark">
                Status
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-gray-300 px-4 py-3">
                <input
                  id="active"
                  name="active"
                  type="checkbox"
                  checked={formValues.active}
                  onChange={handleActiveChange}
                  className="h-5 w-5 rounded focus:outline-none focus:ring-2 focus:ring-primary-light"
                />
                <div className="text-sm">
                  <p className="font-medium text-primary-dark">{formValues.active ? "Active" : "Inactive"}</p>
                  <p className="text-xs text-gray-500">
                    Active team members appear in scheduling and payroll workflows.
                  </p>
                </div>
              </div>
            </div>
          </div>
          {error && (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Create Employee"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/employees")}
              className="text-sm font-semibold text-primary-dark hover:underline"
            >
              Cancel
            </button>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}

