'use client';

import { useState, useEffect, ChangeEvent, FormEvent, useId } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import { supabase } from "@/supabase/client";

type Params = { id: string };

export default function EmployeeSettings({ params }: { params: Params }) {
  const empId = Number(params.id);
  const router = useRouter();
  const [form, setForm] = useState({
    pay_rate: "",
    address: "",
    emergency_contact: "",
  });
  const [loading, setLoading] = useState(true);
  const headingId = useId();
  const payRateId = useId();
  const addressId = useId();
  const emergencyId = useId();

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("employees")
        .select("pay_rate, address, emergency_contact")
        .eq("id", empId)
        .single();
      if (data) {
        setForm({
          pay_rate: data.pay_rate ?? "",
          address: data.address ?? "",
          emergency_contact: data.emergency_contact ?? "",
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [empId]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("employees")
      .update({
        pay_rate: form.pay_rate,
        address: form.address,
        emergency_contact: form.emergency_contact,
      })
      .eq("id", empId);
    if (!error) {
      router.refresh();
      alert("Employee updated successfully.");
    } else {
      alert("Error updating employee.");
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <p>Loading...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 id={headingId} className="mb-4 text-2xl font-bold">
        Employee Settings
      </h1>
      <form
        onSubmit={handleSubmit}
        aria-labelledby={headingId}
        className="max-w-md space-y-4"
      >
        <div>
          <label htmlFor={payRateId} className="mb-1 block font-medium">
            Pay rate
          </label>
          <input
            id={payRateId}
            type="number"
            step="0.01"
            name="pay_rate"
            value={form.pay_rate}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 focus:ring-offset-white"
          />
        </div>
        <div>
          <label htmlFor={addressId} className="mb-1 block font-medium">
            Address
          </label>
          <input
            id={addressId}
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 focus:ring-offset-white"
          />
        </div>
        <div>
          <label htmlFor={emergencyId} className="mb-1 block font-medium">
            Emergency contact
          </label>
          <input
            id={emergencyId}
            type="text"
            name="emergency_contact"
            value={form.emergency_contact}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 focus:ring-offset-white"
          />
        </div>
        <button
          type="submit"
          className="focus-ring rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Save
        </button>
      </form>
    </PageContainer>
  );
}
