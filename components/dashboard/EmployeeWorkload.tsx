import { listAppointmentsForRange } from '@/lib/server/read/listAppointmentsForRange'
import { deriveAppointmentStatus } from '@/lib/status/appointmentStatus'

export default async function EmployeeWorkload() {
  const now = new Date()
  const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0)
  const endOfDay = new Date(now); endOfDay.setHours(23,59,59,999)

  const { data } = await listAppointmentsForRange({
    start: startOfDay.toISOString(),
    end: endOfDay.toISOString(),
    limit: 200
  })

  const counts: Record<string, number> = {}
  for (const appt of data) {
    const derived = deriveAppointmentStatus(appt.status, appt.start_at, appt.end_at, now)
    if (['canceled','no_show'].includes(derived.canonical)) continue
    const key = appt.staff_id ?? 'Unassigned'
    counts[key] = (counts[key] ?? 0) + 1
  }

  const workloads = Object.entries(counts).map(([staffId, count]) => ({
    staffId,
    count
  }))

  if (!workloads.length) {
    return (
      <div className="rounded-3xl border border-white/25 bg-white/10 p-6 text-white/85 backdrop-blur-lg">
        No active jobs.
      </div>
    )
  }

  const max = Math.max(...workloads.map(w => w.count), 1)

  return (
    <ul className="space-y-3 text-white/90">
      {workloads.map(wl => {
        const width = Math.max((wl.count / max) * 100, 12)
        return (
          <li key={wl.staffId} className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-inner backdrop-blur">
            <div className="flex items-center justify-between text-sm font-semibold tracking-tight">
              <span>{wl.staffId === 'Unassigned' ? 'Unassigned' : wl.staffId}</span>
              <span className="flex items-center gap-1 text-xs uppercase">
                <span className="inline-flex h-2 w-2 rounded-full bg-white/80" />
                {wl.count} {wl.count === 1 ? 'appt' : 'appts'}
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/15">
              <div className="h-full rounded-full bg-white/80" style={{ width: `${width}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}