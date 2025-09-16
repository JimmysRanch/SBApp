"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import { supabase } from "@/lib/supabase/client";

interface FormValues {
  name: string;
  role: string;
  phone: string;
  email: string;
  address: string;
  photoUrl: string;
}

const initialForm: FormValues = {
  name: "",
  role: "",
  phone: "",
  email: "",
  address: "",
  photoUrl: "",
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
      const { data, error: insertError } = await supabase
        .from("employees")
        .insert([
          {
            name: trimmedName,
            role: toNullable(formValues.role),
            phone: toNullable(formValues.phone),
            email: toNullable(formValues.email),
            address: toNullable(formValues.address),
            photo_url: toNullable(formValues.photoUrl),
            active: true,
          },
        ])
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
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
              <label htmlFor="role" className="mb-1 block text-sm font-semibold text-primary-dark">
                Role / Title
              </label>
              <input
                id="role"
                name="role"
                value={formValues.role}
                onChange={handleChange}
                placeholder="Groomer"
                autoComplete="organization-title"
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
            <div className="md:col-span-2">
              <label htmlFor="address" className="mb-1 block text-sm font-semibold text-primary-dark">
                Address
              </label>
              <input
                id="address"
                name="address"
                value={formValues.address}
                onChange={handleChange}
                placeholder="123 Main St, City, ST"
                autoComplete="street-address"
                className="w-full rounded-2xl border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="photoUrl" className="mb-1 block text-sm font-semibold text-primary-dark">
                Photo URL
              </label>
              <input
                id="photoUrl"
                name="photoUrl"
                type="url"
                value={formValues.photoUrl}
                onChange={handleChange}
                placeholder="https://..."
                autoComplete="off"
                className="w-full rounded-2xl border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
              />
              <p className="mt-1 text-xs text-gray-500">
                Provide a link to an image to use for the employee profile photo.
              </p>
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

