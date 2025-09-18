import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "./server";
import {
  CalendarEvent,
  CalendarEventCreate,
  CalendarEventUpdate,
  normalizeDate,
  type TCalendarEvent,
} from "../validation/calendar";

const TABLE = "calendar_events";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const usingMockData = !serviceRoleKey || serviceRoleKey.trim() === "";

type CalendarStore = { events: TCalendarEvent[] };

const globalCalendar = globalThis as typeof globalThis & {
  __scruffyCalendarStore?: CalendarStore;
};

function generateId() {
  if (typeof randomUUID === "function") return randomUUID();
  return `mock-${Math.random().toString(36).slice(2, 10)}`;
}

function atStartOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildMockEvent(
  title: string,
  type: "appointment" | "shift" | "timeOff",
  dayOffset: number,
  startHour: number,
  durationHours: number,
  options: { notes?: string; staffId?: number | null; allDay?: boolean } = {},
): TCalendarEvent {
  const today = new Date();
  const start = atStartOfDay(today);
  start.setDate(start.getDate() + dayOffset);
  if (!options.allDay) {
    start.setHours(startHour, 0, 0, 0);
  }
  const end = new Date(start);
  if (options.allDay) {
    end.setDate(end.getDate() + durationHours);
    end.setHours(0, 0, 0, 0);
  } else {
    end.setHours(start.getHours() + durationHours, start.getMinutes(), 0, 0);
  }

  const timestamp = new Date().toISOString();

  return CalendarEvent.parse({
    id: `mock-${generateId()}`,
    title,
    type,
    start: start.toISOString(),
    end: end.toISOString(),
    notes: options.notes ?? null,
    staffId: options.staffId ?? null,
    petId: null,
    allDay: options.allDay ?? false,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

function createInitialMockEvents(): TCalendarEvent[] {
  const seed: TCalendarEvent[] = [
    buildMockEvent("Poodle Spa – Bella", "appointment", 0, 9, 2, {
      notes: "Full groom with blueberry facial.",
      staffId: 101,
    }),
    buildMockEvent("Evening Shift", "shift", 1, 12, 6, {
      notes: "Front desk coverage",
      staffId: 102,
    }),
    buildMockEvent("Team Training", "appointment", -2, 14, 1, {
      notes: "Safety & CPR refresher",
      staffId: 101,
    }),
    buildMockEvent("Day off – Marla", "timeOff", 3, 0, 1, {
      allDay: true,
      notes: "Approved PTO",
      staffId: 103,
    }),
    buildMockEvent("Doodle Trim – Gus", "appointment", 5, 10, 1, {
      staffId: 102,
    }),
    buildMockEvent("Giant Breed Bath", "appointment", -5, 11, 3, {
      staffId: 101,
    }),
  ];

  const additional = buildMockEvent("New Client Intake", "appointment", 8, 15, 1, {
    notes: "Meet & greet for Sparky",
    staffId: 104,
  });

  return [...seed, additional].map((event) => CalendarEvent.parse(event));
}

function ensureMockStore(): CalendarStore {
  if (!globalCalendar.__scruffyCalendarStore) {
    globalCalendar.__scruffyCalendarStore = { events: createInitialMockEvents() };
  }
  return globalCalendar.__scruffyCalendarStore;
}

function cloneEvent(event: TCalendarEvent): TCalendarEvent {
  return { ...event };
}

function matchesFilters(event: TCalendarEvent, params: { from?: string; to?: string; staffId?: number; type?: string }) {
  if (params.from) {
    const fromDate = new Date(params.from);
    if (new Date(event.end) < fromDate) return false;
  }
  if (params.to) {
    const toDate = new Date(params.to);
    if (new Date(event.start) > toDate) return false;
  }
  if (params.staffId !== undefined) {
    if (event.staffId !== params.staffId) return false;
  }
  if (params.type && event.type !== params.type) return false;
  return true;
}

export function calendarUsesMockData() {
  return usingMockData;
}

export async function listEvents(params: { from?: string; to?: string; staffId?: number; type?: string } = {}) {
  if (usingMockData) {
    const store = ensureMockStore();
    return store.events
      .filter((event) => matchesFilters(event, params))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .map((event) => cloneEvent(event));
  }

  const client = getSupabaseAdmin();
  let q = client.from(TABLE).select("*").order("start", { ascending: true });
  if (params.from) q = q.gte("end", params.from);
  if (params.to) q = q.lte("start", params.to);
  if (params.staffId !== undefined) q = q.eq("staffId", params.staffId);
  if (params.type) q = q.eq("type", params.type);
  const { data, error } = await q;
  if (error) throw error;
  return data?.map((d) => CalendarEvent.parse(d)) ?? [];
}

export async function getEvent(id: string) {
  if (usingMockData) {
    const store = ensureMockStore();
    const found = store.events.find((event) => event.id === id);
    if (!found) throw new Error("Not found");
    return cloneEvent(found);
  }

  const client = getSupabaseAdmin();
  const { data, error } = await client.from(TABLE).select("*").eq("id", id).single();
  if (error) throw error;
  return CalendarEvent.parse(data);
}

export async function createEvent(payload: any) {
  if (usingMockData) {
    const parsed = CalendarEventCreate.parse(payload);
    const now = new Date().toISOString();
    const next: TCalendarEvent = CalendarEvent.parse({
      id: `mock-${generateId()}`,
      title: parsed.title,
      type: parsed.type,
      start: normalizeDate(parsed.start),
      end: normalizeDate(parsed.end),
      notes: parsed.notes ?? null,
      staffId: parsed.staffId ?? null,
      petId: parsed.petId ?? null,
      allDay: parsed.allDay ?? false,
      createdAt: now,
      updatedAt: now,
    });
    const store = ensureMockStore();
    store.events = [...store.events, next];
    return cloneEvent(next);
  }

  const parsed = CalendarEventCreate.parse(payload);
  const body = {
    ...parsed,
    start: normalizeDate(parsed.start),
    end: normalizeDate(parsed.end),
  };
  body.staffId = parsed.staffId ?? null;
  const client = getSupabaseAdmin();
  const { data, error } = await client.from(TABLE).insert(body).select().single();
  if (error) throw error;
  return CalendarEvent.parse(data);
}

export async function updateEvent(id: string, payload: any) {
  if (usingMockData) {
    const parsed = CalendarEventUpdate.parse(payload);
    const store = ensureMockStore();
    const index = store.events.findIndex((event) => event.id === id);
    if (index === -1) throw new Error("Not found");

    const existing = store.events[index];
    const next: TCalendarEvent = {
      ...existing,
      ...parsed,
      start: parsed.start ? normalizeDate(parsed.start) : existing.start,
      end: parsed.end ? normalizeDate(parsed.end) : existing.end,
      notes: parsed.notes === undefined ? existing.notes : parsed.notes ?? null,
      staffId: parsed.staffId === undefined ? existing.staffId : parsed.staffId ?? null,
      petId: parsed.petId === undefined ? existing.petId : parsed.petId ?? null,
      allDay: parsed.allDay === undefined ? existing.allDay : parsed.allDay,
      updatedAt: new Date().toISOString(),
    };
    store.events[index] = CalendarEvent.parse(next);
    return cloneEvent(store.events[index]);
  }

  const parsed = CalendarEventUpdate.parse(payload);
  const body: Record<string, any> = { ...parsed };
  if (parsed.start) body.start = normalizeDate(parsed.start);
  if (parsed.end) body.end = normalizeDate(parsed.end);
  if (parsed.staffId !== undefined) body.staffId = parsed.staffId ?? null;
  const client = getSupabaseAdmin();
  const { data, error } = await client.from(TABLE).update(body).eq("id", id).select().single();
  if (error) throw error;
  return CalendarEvent.parse(data);
}

export async function deleteEvent(id: string) {
  if (usingMockData) {
    const store = ensureMockStore();
    const index = store.events.findIndex((event) => event.id === id);
    if (index === -1) throw new Error("Not found");
    store.events.splice(index, 1);
    return { id };
  }

  const client = getSupabaseAdmin();
  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) throw error;
  return { id };
}
