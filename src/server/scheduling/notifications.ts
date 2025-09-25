import { enqueueAudit, registerNotificationToken } from "@/lib/notifications";
import {
  appointmentIdSchema,
  registerPushTokenSchema,
  type AppointmentIdInput,
  type RegisterPushTokenInput,
} from "./schemas";

export async function registerPushToken(rawInput: RegisterPushTokenInput) {
  const input = registerPushTokenSchema.parse(rawInput);
  await registerNotificationToken({
    userId: input.userId,
    platform: input.platform,
    token: input.token,
  });
}

async function logNotification(action: string, rawInput: AppointmentIdInput) {
  const input = appointmentIdSchema.parse(rawInput);
  await enqueueAudit({
    actor: input.actorId ?? null,
    action,
    entity: "appointments",
    entityId: input.appointmentId,
  });
}

export async function sendReminder(appointmentId: string, actorId?: string) {
  await logNotification("appointment_reminder_queued", { appointmentId, actorId });
}

export async function sendPickupReady(appointmentId: string, actorId?: string) {
  await logNotification("appointment_pickup_ready", { appointmentId, actorId });
}