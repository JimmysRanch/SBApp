'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
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
      <h1 className="text-2xl font-bold mb-4">Employee Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block font-medium mb-1">Pay Rate</label>
          <input
            type="number"
            step="0.01"
            name="pay_rate"
            value={form.pay_rate}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Address</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Emergency Contact</label>
          <input
            type="text"
            name="emergency_contact"
            value={form.emergency_contact}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save
        </button>
      </form>
    </PageContainer>
  );
}
