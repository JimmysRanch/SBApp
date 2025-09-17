import { z } from "zod";

export const CalendarEventType = z.enum(["appointment", "shift", "timeOff"]);

export const CalendarEventBase = z.object({
  title: z.string().min(1),
  type: CalendarEventType,
  start: z.string().or(z.date()),
  end: z.string().or(z.date()),
  notes: z.string().optional().nullable(),
  staffId: z.string().optional().nullable(),
  petId: z.string().optional().nullable(),
  allDay: z.boolean().optional().default(false),
});

export const CalendarEventCreate = CalendarEventBase.refine(
  (d) => new Date(d.start) <= new Date(d.end),
  { message: "start must be before end", path: ["start"] }
);

export const CalendarEventUpdate = CalendarEventCreate.partial();

export const CalendarEvent = CalendarEventBase.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TCalendarEvent = z.infer<typeof CalendarEvent>;
export type TCalendarEventCreate = z.infer<typeof CalendarEventCreate>;
export type TCalendarEventUpdate = z.infer<typeof CalendarEventUpdate>;

export function normalizeDate(v: string | Date): string {
  return v instanceof Date ? v.toISOString() : new Date(v).toISOString();
}
