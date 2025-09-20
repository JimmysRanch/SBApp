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

  if (loading) return <div className="text-brand-cream/70">Loading...</div>
  if (workloads.length === 0)
    return (
      <div className="rounded-3xl border border-white/8 bg-brand-onyx/60 p-6 text-brand-cream/75 shadow-[0_24px_60px_-40px_rgba(5,12,32,0.9)] backdrop-blur-xl">
        No active jobs.
      </div>
    )

  const max = workloads.length ? Math.max(...workloads.map((w) => w.count), 1) : 1

  return (
    <ul className="space-y-3 text-brand-cream">
      {workloads.map((wl) => {
        const width = Math.max((wl.count / max) * 100, 12)
        return (
          <li
            key={wl.employee_name}
            className="rounded-3xl border border-white/10 bg-brand-onyx/70 p-4 shadow-[0_24px_60px_-40px_rgba(5,12,32,0.9)] backdrop-blur"
          >
            <div className="flex items-center justify-between text-sm font-semibold tracking-tight">
              <span>{wl.employee_name}</span>
              <span className="flex items-center gap-1 text-xs uppercase">
                <span className="inline-flex h-2 w-2 rounded-full bg-brand-bubble" />
                {wl.count} {wl.count === 1 ? 'dog' : 'dogs'}
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-bubble via-secondary.purple to-primary.light"
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
