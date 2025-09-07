"use client";
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

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

  if (loading) return <div>Loading...</div>
  if (workloads.length === 0) return <div>No active jobs.</div>
  return (
    <ul className="space-y-1">
      {workloads.map((wl) => (
        <li key={wl.employee_name} className="flex justify-between">
          <span>{wl.employee_name}</span>
          <span className="font-semibold">{wl.count}</span>
        </li>
      ))}
    </ul>
  )
}
