import { z } from 'zod';

export const appointmentStatuses = [
  'booked',
  'checked_in',
  'in_progress',
  'completed',
  'canceled',
  'no_show',
] as const;

export const appointmentStatusSchema = z.enum(appointmentStatuses);

export const slotQuerySchema = z.object({
  staffId: z.string().uuid().optional(),
  serviceId: z.string().uuid(),
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export const createAppointmentSchema = z
  .object({
    staffId: z.string().uuid(),
    clientId: z.string().uuid(),
    petId: z.string().uuid().optional(),
    serviceId: z.string().uuid(),
    startsAt: z.coerce.date(),
    addOnIds: z.array(z.string().uuid()).default([]),
    discount: z.coerce.number().min(0).default(0),
    tax: z.coerce.number().min(0).default(0),
    status: appointmentStatusSchema.optional(),
    notes: z
      .string()
      .max(5000)
      .optional(),
    createdBy: z.string().uuid().optional(),
    durationMin: z.number().int().positive().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.addOnIds.length !== new Set(data.addOnIds).size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Duplicate add-on ids are not allowed',
        path: ['addOnIds'],
      });
    }
  });

export const updateAppointmentSchema = z
  .object({
    status: appointmentStatusSchema.optional(),
    discount: z.coerce.number().min(0).optional(),
    tax: z.coerce.number().min(0).optional(),
    notes: z
      .string()
      .max(5000)
      .optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field must be provided',
  });

export const cancelAppointmentSchema = z.object({
  id: z.string().uuid(),
  reason: z
    .string()
    .max(500)
    .optional(),
});

export const listDaySchema = z.object({
  date: z.coerce.date(),
  staffId: z.string().uuid().optional(),
});

export const listWeekSchema = z.object({
  weekStart: z.coerce.date(),
  staffId: z.string().uuid().optional(),
});

export const rescheduleLinkSchema = z.object({
  appointmentId: z.string().uuid(),
  ttlHours: z.number().int().positive().optional(),
  createdBy: z.string().uuid().optional(),
});

export const applyRescheduleSchema = z.object({
  token: z.string().min(10),
  newSlot: z.object({
    serviceId: z.string().uuid(),
    staffId: z.string().uuid().optional(),
    startsAt: z.coerce.date(),
  }),
});

export const registerPushTokenSchema = z.object({
  userId: z.string().uuid(),
  platform: z.literal('web'),
  token: z.string().min(16),
});

export const appointmentIdSchema = z.object({
  appointmentId: z.string().uuid(),
  actorId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export type SlotQueryInput = z.infer<typeof slotQuerySchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type ListDayInput = z.infer<typeof listDaySchema>;
export type ListWeekInput = z.infer<typeof listWeekSchema>;
export type RescheduleLinkInput = z.infer<typeof rescheduleLinkSchema>;
export type ApplyRescheduleInput = z.infer<typeof applyRescheduleSchema>;
export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;
export type AppointmentIdInput = z.infer<typeof appointmentIdSchema>;
export type AppointmentStatus = (typeof appointmentStatuses)[number];
