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

  if (loading) return <div className="text-brand-navy/60">Loading...</div>
  if (workloads.length === 0)
    return (
      <div className="rounded-[1.85rem] border border-brand-navy/10 bg-white/85 p-6 text-sm text-brand-navy/70 shadow-[0_16px_40px_-35px_rgba(8,15,41,0.55)]">
        No active jobs.
      </div>
    )

  const max = workloads.length ? Math.max(...workloads.map((w) => w.count), 1) : 1

  return (
    <ul className="space-y-3 text-brand-navy">
      {workloads.map((wl) => {
        const width = Math.max((wl.count / max) * 100, 12)
        return (
          <li
            key={wl.employee_name}
            className="group relative overflow-hidden rounded-[1.85rem] border border-brand-navy/5 bg-white/95 p-5 shadow-[0_18px_35px_-30px_rgba(7,12,30,0.55)] transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between text-sm font-semibold tracking-tight">
              <span>{wl.employee_name}</span>
              <span className="flex items-center gap-1 text-xs uppercase">
                <span className="inline-flex h-2 w-2 rounded-full bg-brand-blue/60" />
                {wl.count} {wl.count === 1 ? 'dog' : 'dogs'}
              </span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-brand-blue/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-blue via-brand-mint to-secondary"
                style={{ width: `${width}%` }}
              />
            </div>
            <div className="pointer-events-none absolute inset-x-4 bottom-2 h-[1px] bg-gradient-to-r from-transparent via-brand-blue/25 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </li>
        )
      })}
    </ul>
  )
}
