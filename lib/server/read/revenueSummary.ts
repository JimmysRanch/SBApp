import { createClient } from '@/lib/supabase/server'

export interface RevenueSummary {
  total_revenue: number
  finished_appointments: number
  avg_ticket: number
  range: { start: string; end: string }
}

export async function revenueSummary(startISO: string, endISO: string) {
  const sb = createClient()
  const { data, error } = await sb.rpc('revenue_summary', {
    p_start: startISO,
    p_end: endISO
  })
  if (error) throw error
  return data as RevenueSummary
}