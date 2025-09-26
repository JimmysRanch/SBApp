"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Card from "@/components/Card";
import PageContainer from "@/components/PageContainer";
import { supabase } from "@/lib/supabase/client";

type HoursRow = { dow: number; opens: string; closes: string };

const DEFAULT_ROWS: HoursRow[] = [
  { dow: 1, opens: "08:00", closes: "18:00" },
  { dow: 2, opens: "08:00", closes: "18:00" },
  { dow: 3, opens: "08:00", closes: "18:00" },
  { dow: 4, opens: "08:00", closes: "18:00" },
  { dow: 5, opens: "08:00", closes: "18:00" },
];

const DAY_LABELS: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export default function BusinessSettingsPage() {
  const [rows, setRows] = useState<HoursRow[]>(DEFAULT_ROWS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const orderedRows = useMemo(
    () => [...rows].sort((a, b) => a.dow - b.dow),
    [rows],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { data, error } = await supabase
        .from("shop_hours")
        .select("dow,opens,closes")
        .order("dow", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setRows(data as HoursRow[]);
      } else {
        setRows(DEFAULT_ROWS);
      }
    } catch (error: any) {
      setMessage(error?.message ?? "Unable to load business hours.");
      setRows(DEFAULT_ROWS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateRow = useCallback((dow: number, field: "opens" | "closes", value: string) => {
    setRows((prev) => {
      const existing = prev.find((row) => row.dow === dow);
      if (!existing) {
        return [...prev, { dow, opens: field === "opens" ? value : "", closes: field === "closes" ? value : "" }];
      }
      return prev.map((row) => (row.dow === dow ? { ...row, [field]: value } : row));
    });
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = orderedRows.map((row) => ({ ...row }));
      const { error } = await supabase.from("shop_hours").upsert(payload, { onConflict: "dow" });
      if (error) throw error;
      setMessage("Hours saved successfully.");
    } catch (error: any) {
      setMessage(error?.message ?? "Unable to save business hours.");
    } finally {
      setSaving(false);
    }
  }, [orderedRows]);

  return (
    <PageContainer>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Business Hours</h1>
            <p className="text-sm text-gray-600">Control your weekly opening and closing times.</p>
          </div>
          <button
            className="rounded bg-brand-bubble px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-bubbleDark"
            disabled={saving}
            onClick={save}
            type="button"
          >
            {saving ? "Saving…" : "Save hours"}
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Day</th>
                <th className="px-4 py-3">Opens</th>
                <th className="px-4 py-3">Closes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orderedRows.map((row) => (
                <tr key={row.dow} className="bg-white">
                  <td className="px-4 py-3 font-medium text-gray-900">{DAY_LABELS[row.dow] ?? `Day ${row.dow}`}</td>
                  <td className="px-4 py-3">
                    <input
                      className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:border-brand-bubble focus:outline-none focus:ring-1 focus:ring-brand-bubble"
                      disabled={loading}
                      type="time"
                      value={row.opens}
                      onChange={(event) => updateRow(row.dow, "opens", event.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:border-brand-bubble focus:outline-none focus:ring-1 focus:ring-brand-bubble"
                      disabled={loading}
                      type="time"
                      value={row.closes}
                      onChange={(event) => updateRow(row.dow, "closes", event.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>{loading ? "Loading hours…" : "Set times in 24-hour format."}</span>
          {message && <span className="font-semibold text-brand-bubbleDark">{message}</span>}
        </div>
      </Card>
    </PageContainer>
  );
}
