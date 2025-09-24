import { createClient } from "@/lib/supabase/server";

type Message = {
  id: string;
  sender: string | null;
  recipient: string | null;
  body: string | null;
  created_at: string | null;
};

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
});

function formatTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return timeFormatter.format(date);
}

export default async function Messages() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender, recipient, body, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Failed to load recent messages", error);
    return (
      <div className="rounded-3xl border border-red-200/40 bg-red-100/30 p-6 text-sm text-red-700 backdrop-blur-lg">
        Failed to load messages.
      </div>
    );
  }

  const messages = data ?? [];
  if (!messages.length)
    return (
      <div className="rounded-3xl border border-white/25 bg-white/10 p-6 text-white/80 backdrop-blur-lg">
        No messages yet.
      </div>
    );

  return (
    <ul className="space-y-3">
      {messages.map((msg) => (
        <li
          key={msg.id}
          className="rounded-3xl border border-white/25 bg-white/95 p-4 text-brand-navy shadow-lg backdrop-blur"
        >
          <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-brand-navy/70">
            <span>
              {(msg.sender ?? "Unknown") + " → " + (msg.recipient ?? "Unknown")}
            </span>
            <span>{formatTime(msg.created_at)}</span>
          </div>
          <p className="mt-2 max-h-14 overflow-hidden text-sm text-brand-navy/80" title={msg.body ?? ""}>
            {msg.body ?? ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
