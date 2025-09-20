"use client";
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Workload {
  employee_name: string
  count: number
}

type WorkloadRow = {
  employee_id: number | null
  status: string | null
  start_time: string
  employees?:
    | { name: string | null }[]
    | { name: string | null }
    | null
}

const ACTIVE_STATUS_KEYS = new Set(['checked_in', 'in_progress'])

export default function EmployeeWorkload() {
  const [workloads, setWorkloads] = useState<Workload[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const fetchWorkloads = async () => {
      setLoading(true)
      const now = new Date()
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(now)
      endOfDay.setHours(23, 59, 59, 999)

      try {
        // Only fetch the appointments that could still be "active" today so we avoid
        // loading the entire historical appointments table (which had started to slow
        // the dashboard down as more records were added).
        const { data, error } = await supabase
          .from('appointments')
          .select('employee_id, status, start_time, employees ( name )')
          .gte('start_time', startOfDay.toISOString())
          .lte('start_time', endOfDay.toISOString())
          .in('status', [
            'checked_in',
            'in_progress',
            'checked-in',
            'in-progress',
            'Checked In',
            'In Progress',
            'Checked-In',
            'In-Progress',
          ])

        if (error) throw error

        const counts = new Map<string, number>()
        const rows: WorkloadRow[] = data ?? []
        rows.forEach((row) => {
          const statusKey = (row.status ?? '')
            .toString()
            .toLowerCase()
            .replace(/[-\s]+/g, '_')
          if (!ACTIVE_STATUS_KEYS.has(statusKey)) return

          const employeeRelation = Array.isArray(row.employees) ? row.employees[0] : row.employees
          const nameFromRelation = employeeRelation?.name?.trim()
          const fallbackName =
            row.employee_id !== null && row.employee_id !== undefined
              ? `Employee #${row.employee_id}`
              : 'Unassigned'
          const name = nameFromRelation && nameFromRelation.length > 0 ? nameFromRelation : fallbackName
          counts.set(name, (counts.get(name) ?? 0) + 1)
        })

        if (active) {
          const sorted = Array.from(counts.entries())
            .map(([employee_name, count]) => ({ employee_name, count }))
            .sort((a, b) => {
              if (b.count !== a.count) return b.count - a.count
              return a.employee_name.localeCompare(b.employee_name)
            })
          setWorkloads(sorted)
        }
      } catch (err) {
        console.error('Failed to load employee workload', err)
        if (active) {
          setWorkloads([])
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }
    void fetchWorkloads()

    return () => {
      active = false
    }
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
