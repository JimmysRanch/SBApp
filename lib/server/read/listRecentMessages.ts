import { createClient } from '@/lib/supabase/server'

export interface ListMessagesResult<T=any> {
  data: T[]
  total: number
  limit: number
  offset: number
  next_offset: number | null
}

export async function listRecentMessages(limit = 50, offset = 0) {
  const sb = createClient()
  const { data, error } = await sb.rpc('list_recent_messages', { p_limit: limit, p_offset: offset })
  if (error) throw error
  return data as ListMessagesResult
}