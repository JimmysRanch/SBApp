"use client";
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { supabase } from '@/lib/supabase/client'

interface Workload {
  employee_name: string
  count: number
}

export default function EmployeeWorkload() {
  const [workloads, setWorkloads] = useState<Workload[]>([])
  const [loading, setLoading] = useState(true)

  const gradients = [
    'from-electric-pink via-electric-orange to-electric-purple',
    'from-electric-blue via-electric-aqua to-electric-purple',
    'from-electric-lime via-brand-mint to-electric-aqua',
    'from-brand-lavender via-electric-purple to-electric-pink'
  ]

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

  if (loading) return <div className="flex items-center gap-2 text-white/80">🐾 Crunching paws-per-groomer stats...</div>
  if (workloads.length === 0)
    return (
      <div className="rounded-[2rem] border border-dashed border-white/35 bg-white/10 p-6 text-white/80 backdrop-blur-xl">
        No active jobs—treat the team to a dance break!
      </div>
    )

  const max = workloads.length ? Math.max(...workloads.map((w) => w.count), 1) : 1

  return (
    <ul className="space-y-4 text-white">
      {workloads.map((wl, index) => {
        const width = Math.max((wl.count / max) * 100, 12)
        const gradient = gradients[index % gradients.length]
        return (
          <li
            key={wl.employee_name}
            className="group relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-gradient-to-r from-white/15 via-white/8 to-white/5 p-4 shadow-[0_26px_50px_-26px_rgba(120,92,255,0.45)] backdrop-blur-2xl"
          >
            <div className="pointer-events-none absolute -left-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-white/12 blur-3xl transition duration-500 group-hover:scale-110" />
            <div className="pointer-events-none absolute -top-16 right-0 h-44 w-44 rounded-full bg-white/12 blur-3xl" />
            <div className="relative flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm uppercase tracking-[0.35em]">{wl.employee_name}</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[0.55rem] uppercase tracking-[0.35em] text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-electric-lime" />
                  {wl.count} {wl.count === 1 ? 'pet' : 'pets'}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className={clsx('h-full rounded-full bg-gradient-to-r transition-all duration-500', gradient)}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
