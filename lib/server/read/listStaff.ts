import { createClient } from '@/lib/supabase/server'

export interface ListStaffRow {
  id: string
  display_name: string
  email: string | null
  phone: string | null
  status: string
  created_at: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  limit: number
  offset: number
  next_offset: number | null
}

export async function listStaff(params: {
  search?: string
  limit?: number
  offset?: number
} = {}) {
  const sb = createClient()
  const { data, error } = await sb.rpc('list_staff', {
    p_search: params.search ?? null,
    p_limit: params.limit ?? 50,
    p_offset: params.offset ?? 0
  })
  if (error) throw error
  return data as PaginatedResult<ListStaffRow>
}