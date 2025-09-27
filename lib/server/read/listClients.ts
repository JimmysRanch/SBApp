import { createClient } from '@/lib/supabase/server'

export interface ListClientRow {
  id: string
  display_name: string
  email: string | null
  phone: string | null
  created_at: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  limit: number
  offset: number
  next_offset: number | null
}

export async function listClients(params: {
  search?: string
  limit?: number
  offset?: number
} = {}) {
  const sb = createClient()
  const { data, error } = await sb.rpc('list_clients', {
    p_search: params.search ?? null,
    p_limit: params.limit ?? 50,
    p_offset: params.offset ?? 0
  })
  if (error) throw error
  return data as PaginatedResult<ListClientRow>
}