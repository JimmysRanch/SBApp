import { getSupabaseAdmin } from "./server";
import {
  CalendarEvent,
  CalendarEventCreate,
  CalendarEventUpdate,
  normalizeDate,
} from "../validation/calendar";

const TABLE = "calendar_events";

export async function listEvents(params: {
  from?: string;
  to?: string;
  staffId?: string;
  type?: string;
  page?: number;
  size?: number;
  businessId?: string;
} = {}) {
  const client = getSupabaseAdmin();
  let q = client.from(TABLE).select("*", { count: 'exact' }).order("start", { ascending: true });
  if (params.from) q = q.gte("end", params.from);
  if (params.to) q = q.lte("start", params.to);
  if (params.staffId) q = q.eq("staffId", params.staffId);
  if (params.type) q = q.eq("type", params.type);
  
  // Business scoping (if business_id exists in calendar_events table)
  // Note: This will need a migration to add business_id to calendar_events if not present
  if (params.businessId) q = q.eq("business_id", params.businessId);

  // Add pagination
  const page = params.page || 1;
  const size = Math.min(params.size || 50, 100); // Max 100 items per page
  const offset = (page - 1) * size;
  q = q.range(offset, offset + size - 1);

  const { data, error, count } = await q;
  if (error) throw error;
  
  return {
    data: data?.map((d) => CalendarEvent.parse(d)) ?? [],
    pagination: {
      page,
      size,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / size),
      hasNext: (count || 0) > offset + size,
      hasPrev: page > 1
    }
  };
}

export async function getEvent(id: string) {
  const client = getSupabaseAdmin();
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return CalendarEvent.parse(data);
}

export async function createEvent(payload: any) {
  const parsed = CalendarEventCreate.parse(payload);
  const body = {
    ...parsed,
    start: normalizeDate(parsed.start),
    end: normalizeDate(parsed.end),
  };
  const client = getSupabaseAdmin();
  const { data, error } = await client
    .from(TABLE)
    .insert(body)
    .select()
    .single();
  if (error) throw error;
  return CalendarEvent.parse(data);
}

export async function updateEvent(id: string, payload: any) {
  const parsed = CalendarEventUpdate.parse(payload);
  const body: Record<string, any> = { ...parsed };
  if (parsed.start) body.start = normalizeDate(parsed.start);
  if (parsed.end) body.end = normalizeDate(parsed.end);
  const client = getSupabaseAdmin();
  const { data, error } = await client
    .from(TABLE)
    .update(body)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return CalendarEvent.parse(data);
}

export async function deleteEvent(id: string) {
  const client = getSupabaseAdmin();
  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) throw error;
  return { id };
}
