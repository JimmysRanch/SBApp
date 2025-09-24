import { getSupabaseAdmin } from "@/lib/supabase/server";

export type NotificationPlatform = "web";

export interface NotificationTokenRow {
  id?: string;
  user_id: string;
  platform: NotificationPlatform;
  token: string;
  last_seen_at: string | null;
}

interface AuditLogInput {
  actor?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
}

interface RegisterTokenInput {
  userId: string;
  platform: NotificationPlatform;
  token: string;
}

export async function registerNotificationToken({
  userId,
  platform,
  token,
}: RegisterTokenInput): Promise<void> {
  const client = getSupabaseAdmin();
  const { error } = await client
    .from("notification_tokens")
    .upsert(
      {
        user_id: userId,
        platform,
        token,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "token" },
    );

  if (error) {
    throw new Error(error.message ?? "Failed to register notification token");
  }
}

export async function getTokensForUser(userId: string): Promise<NotificationTokenRow[]> {
  const client = getSupabaseAdmin();
  const { data, error } = await client
    .from("notification_tokens")
    .select("id, user_id, platform, token, last_seen_at")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message ?? "Failed to fetch notification tokens");
  }

  const rows = (data ?? []) as NotificationTokenRow[];
  return rows.map((row) => ({
    ...row,
    last_seen_at: row.last_seen_at ?? null,
  }));
}

export async function enqueueAudit({
  actor,
  action,
  entity,
  entityId,
}: AuditLogInput): Promise<void> {
  const client = getSupabaseAdmin();
  const { error } = await client.from("audit_log").insert({
    actor_id: actor ?? null,
    action,
    entity,
    entity_id: entityId ?? null,
  });

  if (error) {
    throw new Error(error.message ?? "Failed to enqueue audit log entry");
  }
}

interface WebPushPayload {
  [key: string]: unknown;
}

export async function sendWebPush(
  tokens: NotificationTokenRow[],
  payload: WebPushPayload,
): Promise<number> {
  const tokenCount = tokens.length;
  await enqueueAudit({
    actor: null,
    action: "web_push_stub",
    entity: "notifications",
    entityId: null,
  });

  // TODO: Replace this stub with a real Web Push implementation using the
  // registered tokens and payload once VAPID keys are configured.
  console.info("sendWebPush stub invoked", {
    tokenCount,
    payload,
  });

  return tokenCount;
}
