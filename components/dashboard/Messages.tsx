import { listRecentMessages } from '@/lib/server/read/listRecentMessages'

export default async function Messages() {
  const { data } = await listRecentMessages(5, 0)
  if (!data.length) {
    return (
      <div className="rounded-3xl border border-white/25 bg-white/10 p-6 text-white/80 backdrop-blur-lg">
        No messages yet.
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {data.map(msg => (
        <li
          key={msg.id}
          className="rounded-3xl border border-white/25 bg-white/95 p-4 text-brand-navy shadow-lg backdrop-blur"
        >
          <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-brand-navy/70">
            <span>
              {msg.direction === 'out' ? 'You → Client' : 'Client → You'}
            </span>
            <span>{new Date(msg.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <p className="mt-2 max-h-14 overflow-hidden text-sm text-brand-navy/80" title={msg.body}>
            {msg.body}
          </p>
        </li>
      ))}
    </ul>
  )
}