"use client";
import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { supabase } from "@/supabase/client";
type Emp = { name: string; active: boolean | null };
export default function EmployeeDetailClient({ employeeId }: { employeeId: string }) {
  const [loading, setLoading] = useState(true);
  const [emp, setEmp] = useState<Emp | null>(null);
  useEffect(() => { (async () => {
    const { data } = await supabase.from("employees").select("name,active").eq("id", employeeId).single();
    if (data) setEmp(data as Emp); setLoading(false);
  })(); }, [employeeId]);
  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (!emp) return null;
  return (<Card><h2 className="text-2xl font-bold">{emp.name}</h2>
    <p className="text-gray-600">Status: {emp.active ? "Active" : "Inactive"}</p></Card>);
}
