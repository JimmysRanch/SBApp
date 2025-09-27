import { createClient } from '@/lib/supabase/server'

export interface ListAppointmentsResult<T=any> {
  data: T[]
  total: number
  limit: number
  offset: number
  next_offset: number | null
}

export async function listAppointmentsForRange(params: {
  staffId?: string
  start: string
  end: string
  limit?: number
  offset?: number
}) {
  const sb = createClient()
  const { data, error } = await sb.rpc('list_appointments_for_range', {
    p_staff: params.staffId ?? null,
    p_start: params.start,
    p_end: params.end,
    p_limit: params.limit ?? 50,
    p_offset: params.offset ?? 0
  })
  if (error) throw error
  return data as ListAppointmentsResult
}