import { createClient } from '@/lib/supabase/server'

interface Message {
  id: string
  sender: string
  recipient: string
  body: string
  created_at: string
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default async function Messages() {
  const supabase = createClient()
  const { data } = await supabase
    .from('messages')
    .select('id, sender, recipient, body, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const messages = (data ?? []) as Message[]

  if (!messages.length)
    return (
      <div className="rounded-3xl border border-white/25 bg-white/10 p-6 text-white/80 backdrop-blur-lg">
        No messages yet.
      </div>
    )

  return (
    <ul className="space-y-3">
      {messages.map((msg) => (
        <li
          key={msg.id}
          className="rounded-3xl border border-white/25 bg-white/95 p-4 text-brand-navy shadow-lg backdrop-blur"
        >
          <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-brand-navy/70">
            <span>
              {msg.sender} → {msg.recipient}
            </span>
            <span>{formatTime(msg.created_at)}</span>
          </div>
          <p className="mt-2 max-h-14 overflow-hidden text-sm text-brand-navy/80" title={msg.body}>
            {msg.body}
          </p>
        </li>
      ))}
    </ul>
  )
}
