import { supabaseAdmin } from "./server";
import { CalendarEvent, CalendarEventCreate, CalendarEventUpdate, normalizeDate } from "../validation/calendar";

const TABLE = "calendar_events";

export async function listEvents(params: { from?: string; to?: string; staffId?: string; type?: string } = {}) {
  let q = supabaseAdmin.from(TABLE).select("*").order("start", { ascending: true });
  if (params.from) q = q.gte("end", params.from);
  if (params.to) q = q.lte("start", params.to);
  if (params.staffId) q = q.eq("staffId", params.staffId);
  if (params.type) q = q.eq("type", params.type);
  const { data, error } = await q;
  if (error) throw error;
  return data?.map((d) => CalendarEvent.parse(d)) ?? [];
}

export async function getEvent(id: string) {
  const { data, error } = await supabaseAdmin.from(TABLE).select("*").eq("id", id).single();
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
  const { data, error } = await supabaseAdmin.from(TABLE).insert(body).select().single();
  if (error) throw error;
  return CalendarEvent.parse(data);
}

export async function updateEvent(id: string, payload: any) {
  const parsed = CalendarEventUpdate.parse(payload);
  const body: Record<string, any> = { ...parsed };
  if (parsed.start) body.start = normalizeDate(parsed.start);
  if (parsed.end) body.end = normalizeDate(parsed.end);
  const { data, error } = await supabaseAdmin.from(TABLE).update(body).eq("id", id).select().single();
  if (error) throw error;
  return CalendarEvent.parse(data);
}

export async function deleteEvent(id: string) {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq("id", id);
  if (error) throw error;
  return { id };
}
