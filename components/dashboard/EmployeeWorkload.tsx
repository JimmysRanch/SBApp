import { createClient } from '@/lib/supabase/server'

interface AppointmentRow {
  groomer_name: string | null
  status: string | null
  start_time: string | null
}

interface Workload {
  employee_name: string
  count: number
}

function buildWorkloads(rows: AppointmentRow[] | null | undefined): Workload[] {
  if (!rows?.length) return []

  const counts: Record<string, number> = {}
  for (const row of rows) {
    const name = row.groomer_name?.trim() || 'Unassigned'
    counts[name] = (counts[name] ?? 0) + 1
  }

  return Object.entries(counts).map(([employee_name, count]) => ({ employee_name, count }))
}

export default async function EmployeeWorkload() {
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  const supabase = createClient()
  const { data } = await supabase
    .from('appointments')
    .select('groomer_name, status, start_time')
    .in('status', ['Checked In', 'In Progress'])
    .gte('start_time', startOfDay.toISOString())
    .lte('start_time', endOfDay.toISOString())

  const workloads = buildWorkloads(data)
  if (!workloads.length)
    return (
      <div className="rounded-3xl border border-white/25 bg-white/10 p-6 text-white/85 backdrop-blur-lg">
        No active jobs.
      </div>
    )

  const max = Math.max(...workloads.map((w) => w.count), 1)

  return (
    <ul className="space-y-3 text-white/90">
      {workloads.map((wl) => {
        const width = Math.max((wl.count / max) * 100, 12)
        return (
          <li
            key={wl.employee_name}
            className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-inner backdrop-blur"
          >
            <div className="flex items-center justify-between text-sm font-semibold tracking-tight">
              <span>{wl.employee_name}</span>
              <span className="flex items-center gap-1 text-xs uppercase">
                <span className="inline-flex h-2 w-2 rounded-full bg-white/80" />
                {wl.count} {wl.count === 1 ? 'dog' : 'dogs'}
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
