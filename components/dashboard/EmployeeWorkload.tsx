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
      // This query groups appointments by assigned groomer and counts active jobs
      const { data, error } = await supabase
        .from('appointments')
        .select('groomer_name, status')

      if (!error && data) {
        const counts: Record<string, number> = {}
        data.forEach((row) => {
          const name = row.groomer_name || 'Unassigned'
          const isActive = ['Checked In', 'In Progress'].includes(row.status)
          if (isActive) counts[name] = (counts[name] || 0) + 1
        })
        setWorkloads(Object.entries(counts).map(([employee_name, count]) => ({ employee_name, count })))
      }
      setLoading(false)
    }
    fetchWorkloads()
  }, [])

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 text-slate-500">Loading team workload…</div>
  if (workloads.length === 0)
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 text-slate-500 shadow-inner">
        No active jobs at the moment.
      </div>
    )

  const max = workloads.length ? Math.max(...workloads.map((w) => w.count), 1) : 1

  return (
    <ul className="space-y-3 text-brand-charcoal">
      {workloads.map((wl) => {
        const width = Math.max((wl.count / max) * 100, 12)
        return (
          <li
            key={wl.employee_name}
            className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-inner shadow-slate-200/40"
          >
            <div className="flex items-center justify-between text-sm font-semibold tracking-tight text-brand-charcoal">
              <span>{wl.employee_name}</span>
              <span className="flex items-center gap-1 text-xs uppercase">
                <span className="inline-flex h-2 w-2 rounded-full bg-primary/70" />
                {wl.count} {wl.count === 1 ? 'dog' : 'dogs'}
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-primary/60"
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
