"use client";
import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { supabase } from "../../../../supabase/client";

export default function NotesCard({ employeeId }: { employeeId: number }) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      const { data } = await supabase
        .from("employee_prefs")
        .select("notes")
        .eq("employee_id", employeeId)
        .maybeSingle();
      if (on) { setNotes((data?.notes as string) ?? ""); setLoaded(true); }
    })();
    return () => { on = false; };
  }, [employeeId]);

  async function save() {
    setSaving(true);
    await supabase
      .from("employee_prefs")
      .upsert({ employee_id: employeeId, notes }, { onConflict: "employee_id" });
    setSaving(false);
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notes</h3>
        <button
          onClick={save}
          disabled={!loaded || saving}
          className="text-sm rounded border px-3 py-1 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      <textarea
        className="mt-3 w-full rounded border p-2 text-sm"
        rows={5}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes for this employee"
      />
    </Card>
  );
}
