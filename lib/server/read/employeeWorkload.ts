import { createClient } from '@/lib/supabase/server'

export interface WorkloadRow {
  staff_id: string
  scheduled: number
  finished: number
  canceled: number
  no_show: number
}

export interface EmployeeWorkloadResult {
  data: WorkloadRow[]
  total_staff: number
  range: { start: string; end: string }
}

export async function employeeWorkload(params: {
  start: string
  end: string
  staffId?: string
}) {
  const sb = createClient()
  const { data, error } = await sb.rpc('employee_workload', {
    p_start: params.start,
    p_end: params.end,
    p_staff: params.staffId ?? null
  })
  if (error) throw error
  return data as EmployeeWorkloadResult
}