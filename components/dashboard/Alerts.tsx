import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Alert = {
  id: string;
  message: string | null;
};

export default async function Alerts() {
  noStore();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("alerts")
    .select("id, message")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Failed to load alerts", error);
    return <div className="text-sm text-red-600">Failed to load alerts.</div>;
  }

  const alerts: Alert[] = data ?? [];
  if (!alerts.length) return <div className="text-sm text-white/80">No alerts.</div>;

  return (
    <ul className="list-inside list-disc space-y-1 text-sm">
      {alerts.map((alert) => (
        <li key={alert.id}>{alert.message ?? ""}</li>
      ))}
    </ul>
  );
}
