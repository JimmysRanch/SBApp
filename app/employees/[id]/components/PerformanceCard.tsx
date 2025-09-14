"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import Card from "@/components/Card";

type Props = { employeeId: string };

type Pet = { breed: string | null };
type Row = {
  scheduled_time: string; // NOTE: if your column is start_at, rename accordingly
  status: string;
  pet: Pet | Pet[];       // Supabase may return object OR array depending on join
};

function weekRange(d = new Date()) {
  const day = d.getDay();            // 0..6
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

function withinRange(iso: string, start: Date, end: Date) {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t < end.getTime();
}

function mode(arr: (string | null | undefined)[]) {
  const counts = new Map<string, number>();
  for (const v of arr) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best = "";
  let bestC = 0;
  for (const [k, c] of counts) {
    if (c > bestC) {
      best = k;
      bestC = c;
    }
  }
  return best || "";
}

export default function PerformanceCard({ employeeId }: Props) {
  const [dogsThisWeek, setDogsThisWeek] = useState(0);
  const [preferredBreed, setPreferredBreed] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      // Narrow the payload. If your time column is start_at, replace scheduled_time with start_at.
      const { data, error } = await supabase
        .from("appointments")
        .select("scheduled_time,status, pet:pets(breed)")
        .eq("employee_id", employeeId);

      if (error || !data) return;

      const raw = data as unknown as Row[];
      const { start, end } = weekRange();

      // normalize pet into a single breed string
      const rows = raw.map((r) => ({
        when: r.scheduled_time,
        status: r.status,
        pet_breed: Array.isArray(r.pet) ? (r.pet[0]?.breed ?? "") : (r.pet?.breed ?? ""),
      }));

      const groomed = rows.filter(
        (r) => r.status === "completed" && withinRange(r.when, start, end)
      );

      if (!mounted) return;
      setDogsThisWeek(groomed.length);
      setPreferredBreed(mode(groomed.map((r) => r.pet_breed)));
    })();
    return () => {
      mounted = false;
    };
  }, [employeeId]);

  return (
    <Card>
      <h3 className="text-lg font-semibold">Performance</h3>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-bold">{dogsThisWeek}</div>
          <div className="text-sm text-gray-600">Dogs groomed this week</div>
        </div>
        <div>
          <div className="text-2xl font-bold">
            {preferredBreed ? preferredBreed : "—"}
          </div>
          <div className="text-sm text-gray-600">Preferred breed (WTD)</div>
        </div>
      </div>
    </Card>
  );
}
