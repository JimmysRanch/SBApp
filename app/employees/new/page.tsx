"use client";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/**
 * Page to create a new employee.  Provides a form to enter the
 * employee's name and active status, then inserts the record into
 * the `employees` table. After saving, redirects back to the employees
 * list.
 */
export default function NewEmployeePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      setSaving(false);
      return;
    }
    const { error: insertError } = await supabase
      .from("employees")
      .insert({ name: name.trim(), active });
    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }
    router.push("/employees");
  };

  return (
    <PageContainer>
      <Card className="mx-auto max-w-xl">
        <h1 className="mb-4 text-2xl font-bold">Add New Employee</h1>
        {error && <p className="mb-2 text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block font-medium">Name</label>
            <input
              type="text"
              className="w-full rounded border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center">
            <input
              id="active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="active" className="select-none">
              Active
            </label>
          </div>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      </Card>
    </PageContainer>
  );
}
