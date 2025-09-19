"use client";
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Workload {
  employee_name: string
  count: number
}

export default function EmployeeWorkload() {
  const [workloads, setWorkloads] = useState<Workload[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWorkloads = async () => {
      const now = new Date()
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(now)
      endOfDay.setHours(23, 59, 59, 999)

      // Only fetch the appointments that could still be "active" today so we avoid
      // loading the entire historical appointments table (which had started to slow
      // the dashboard down as more records were added).
      const { data, error } = await supabase
        .from('appointments')
        .select('groomer_name, status, start_time')
        .in('status', ['Checked In', 'In Progress'])
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())

      if (!error && data) {
        const counts: Record<string, number> = {}
        data.forEach((row) => {
          const name = row.groomer_name || 'Unassigned'
          counts[name] = (counts[name] || 0) + 1
        })
        setWorkloads(Object.entries(counts).map(([employee_name, count]) => ({ employee_name, count })))
      }
      setLoading(false)
    }
    fetchWorkloads()
  }, [])

  if (loading) return <div className="text-white/80">Loading...</div>
  if (workloads.length === 0)
    return (
      <div className="rounded-3xl border border-white/25 bg-white/10 p-6 text-white/85 backdrop-blur-lg">
        No active jobs.
      </div>
    )

  const max = workloads.length ? Math.max(...workloads.map((w) => w.count), 1) : 1

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
              <div
                className="h-full rounded-full bg-white/80"
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
