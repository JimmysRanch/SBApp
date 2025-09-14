"use client";
import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { supabase } from "@/lib/supabase/client";

type Props = { employeeId: string };

type Row = {
  scheduled_time: string;
  status: string | null;
  pet: { breed: string | null } | null;
};

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // start on Monday
  const start = new Date(now.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

export default function PerformanceCard({ employeeId }: Props) {
  const [groomed, setGroomed] = useState(0);
  const [preferredBreed, setPreferredBreed] = useState<string | null>(null);

  useEffect(() => {
    const fetchPerf = async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("scheduled_time,status,pet:pet_id(breed)")
        .eq("employee_id", employeeId);
      if (!error && data) {
        const rows = data as Row[];
        const { start, end } = getWeekRange();
        const groomedRows = rows.filter(
          (r) =>
            r.status === "Completed" &&
            new Date(r.scheduled_time) >= start &&
            new Date(r.scheduled_time) < end
        );
        setGroomed(groomedRows.length);
        const breedCounts: Record<string, number> = {};
        rows.forEach((r) => {
          const breed = r.pet?.breed;
          if (breed) {
            breedCounts[breed] = (breedCounts[breed] || 0) + 1;
          }
        });
        let top: string | null = null;
        let max = 0;
        Object.entries(breedCounts).forEach(([breed, count]) => {
          if (count > max) {
            max = count;
            top = breed;
          }
        });
        setPreferredBreed(top);
      }
    };
    fetchPerf();
  }, [employeeId]);

  return (
    <Card>
      <h2 className="mb-2 text-lg font-semibold">Performance</h2>
      <p>Dogs groomed this week: {groomed}</p>
      <p>Preferred breed: {preferredBreed || "N/A"}</p>
      <p>Dogs not willing: 0</p>
    </Card>
  );
}
