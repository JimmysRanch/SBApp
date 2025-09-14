"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { supabase } from "@/supabase/client";

type Props = { employeeId: string };

export default function PerformanceCard({ employeeId }: Props) {
  const [dogs, setDogs] = useState<number | null>(null);
  const [preferredBreed, setPreferredBreed] = useState<string | null>(null);

  useEffect(() => {
    const loadPerformance = async () => {
      const now = new Date();
      const startOfWeek = new Date(now);
      const endOfWeek = new Date(now);
      const day = now.getDay();
      startOfWeek.setDate(now.getDate() - day);
      startOfWeek.setHours(0, 0, 0, 0);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const { data } = await supabase
        .from("appointments")
        .select("start_time,status,pet:pets(breed)")
        .eq("employee_id", employeeId)
        .gte("start_time", startOfWeek.toISOString())
        .lte("start_time", endOfWeek.toISOString());

      if (data) {
        const completed = data.filter((r) => r.status === "completed");
        setDogs(completed.length);

        const breedCount: Record<string, number> = {};
        completed.forEach((row: any) => {
          const pet = Array.isArray(row.pet) ? row.pet[0] : row.pet;
          const breed = pet?.breed as string | undefined;
          if (breed) {
            breedCount[breed] = (breedCount[breed] || 0) + 1;
          }
        });
        let topBreed: string | null = null;
        let max = 0;
        Object.entries(breedCount).forEach(([breed, count]) => {
          if (count > max) {
            max = count;
            topBreed = breed;
          }
        });
        setPreferredBreed(topBreed);
      }
    };
    loadPerformance();
  }, [employeeId]);

  if (dogs === null) {
    return (
      <Card>
        <h2 className="mb-2 text-lg font-semibold">Performance</h2>
        Loading...
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-2 text-lg font-semibold">Performance</h2>
      <p>Dogs Groomed This Week: {dogs}</p>
      <p>Preferred Breed: {preferredBreed ?? "N/A"}</p>
    </Card>
  );
}
