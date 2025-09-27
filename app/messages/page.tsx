import Card from '@/components/Card';
import PageContainer from '@/components/PageContainer';
import { inQuietHoursLocal, QuietHoursSetting, TimezoneSetting } from '@/lib/time/quietHours';
import { createClient } from '@/lib/supabase/server';

type ThreadRow = {
  id: string;
  last_message_at: string | null;
  unread_count: number;
  client_id: string;
  client_first_name: string | null;
  client_last_name: string | null;
  phone_label: string | null;
  phone_number: string | null;
};

type MessageRow = {
  id: string;
  thread_id: string;
  direction: 'in' | 'out';
  channel: 'sms' | 'mms';
  body: string | null;
  status: string | null;
  created_at: string;
};

type OptOutRow = {
  client_id: string;
  channel: 'sms' | 'mms';
  opted_out_at: string;
};

type SettingRow = {
  key: string;
  value: unknown;
};

export const dynamic = 'force-dynamic';

function parseQuietHours(value: unknown): QuietHoursSetting | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const enabled = Boolean(record.enabled);
  const start = typeof record.start === 'string' ? record.start : '20:00';
  const end = typeof record.end === 'string' ? record.end : '08:00';
  return { enabled, start, end };
}

function parseTimezone(value: unknown): TimezoneSetting | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const iana = typeof record.iana === 'string' && record.iana.length > 0 ? record.iana : 'America/Chicago';
  return { iana };
}

function formatClientName(first: string | null, last: string | null): string {
  const parts = [first?.trim(), last?.trim()].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return 'Client';
}

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  if (Number.isNaN(date.valueOf())) return timestamp;
  return date.toLocaleString();
}

export default async function MessagesPage() {
  const supabase = createClient();
  const appDb = supabase.schema('app');

  const [{ data: settingsRows }, threadsResponse] = await Promise.all([
    appDb.from('settings').select('key,value').in('key', ['quiet_hours', 'timezone']),
    appDb
      .from('message_threads')
      .select(
        `id,last_message_at,unread_count,client_id,client:clients(first_name,last_name),phone:phone_id(label,e164)`
      )
      .order('last_message_at', { ascending: false }),
  ]);

  const settingList: SettingRow[] = Array.isArray(settingsRows) ? (settingsRows as SettingRow[]) : [];
  const quietSetting = parseQuietHours(settingList.find((row) => row.key === 'quiet_hours')?.value ?? null);
  const timezoneSetting = parseTimezone(settingList.find((row) => row.key === 'timezone')?.value ?? null);
  const quietNow = inQuietHoursLocal(quietSetting, timezoneSetting);

  const threadError = threadsResponse.error?.message ?? null;
  const rawThreads = (threadsResponse.data ?? []) as {
    id: string;
    last_message_at: string | null;
    unread_count: number;
    client_id: string;
    client: { first_name: string | null; last_name: string | null } | null;
    phone: { label: string | null; e164: string | null } | null;
  }[];

  const threads: ThreadRow[] = rawThreads.map((row) => ({
    id: row.id,
    last_message_at: row.last_message_at,
    unread_count: row.unread_count ?? 0,
    client_id: row.client_id,
    client_first_name: row.client?.first_name ?? null,
    client_last_name: row.client?.last_name ?? null,
    phone_label: row.phone?.label ?? null,
    phone_number: row.phone?.e164 ?? null,
  }));

  const threadIds = threads.map((thread) => thread.id);

  const [messagesResponse, optOutResponse] = await Promise.all([
    threadIds.length === 0
      ? Promise.resolve({ data: [] as MessageRow[], error: null })
      : appDb
          .from('messages')
          .select('id,thread_id,direction,channel,body,status,created_at')
          .in('thread_id', threadIds)
          .order('created_at', { ascending: true }),
    appDb.from('opt_outs').select('client_id,channel,opted_out_at'),
  ]);

  const messageError = messagesResponse.error?.message ?? null;
  const optOutError = optOutResponse.error?.message ?? null;

  const messages = ((messagesResponse.data ?? []) as MessageRow[]).reduce<Map<string, MessageRow[]>>((map, row) => {
    const existing = map.get(row.thread_id) ?? [];
    existing.push(row);
    map.set(row.thread_id, existing);
    return map;
  }, new Map());

  const optOuts = (optOutResponse.data ?? []) as OptOutRow[];
  const optOutLookup = new Map<string, OptOutRow[]>();
  for (const row of optOuts) {
    const list = optOutLookup.get(row.client_id) ?? [];
    list.push(row);
    optOutLookup.set(row.client_id, list);
  }

  return (
    <PageContainer>
      <Card>
        <div className="mb-6 space-y-2">
          <h1 className="text-3xl font-bold text-primary-dark">Client messaging</h1>
          {quietSetting?.enabled && (
            <p className="text-sm text-primary-dark/70">
              Quiet hours are active from {quietSetting.start} to {quietSetting.end}.{' '}
              {quietNow
                ? 'New outbound messages are currently paused.'
                : 'Outbound messages can be sent right now.'}
            </p>
          )}
        </div>

        {threadError && (
          <div className="mb-4 rounded-2xl border border-red-300/40 bg-red-100/40 px-4 py-3 text-sm text-red-700">
            Failed to load message threads: {threadError}
          </div>
        )}

        {messageError && (
          <div className="mb-4 rounded-2xl border border-amber-300/40 bg-amber-100/40 px-4 py-3 text-sm text-amber-900">
            Some messages could not be retrieved: {messageError}
          </div>
        )}

        {optOutError && (
          <div className="mb-4 rounded-2xl border border-amber-300/40 bg-amber-100/40 px-4 py-3 text-sm text-amber-900">
            Opt-out status unavailable: {optOutError}
          </div>
        )}

        {threads.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-primary-dark/20 bg-white/60 px-4 py-6 text-sm text-primary-dark/80">
            No client conversations yet. Messages will appear here when clients text one of your business numbers.
          </p>
        ) : (
          <div className="space-y-6">
            {threads.map((thread) => {
              const threadMessages = messages.get(thread.id) ?? [];
              const optOutsForClient = optOutLookup.get(thread.client_id) ?? [];
              const optedOutChannels = optOutsForClient.map((entry) => entry.channel.toUpperCase()).join(', ');
              const optedOut = optOutsForClient.length > 0;
              return (
                <section key={thread.id} className="rounded-3xl border border-primary-dark/10 bg-white/70 p-5 shadow-sm">
                  <header className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-primary-dark">
                        {formatClientName(thread.client_first_name, thread.client_last_name)}
                      </h2>
                      <p className="text-sm text-primary-dark/70">
                        {thread.phone_label || 'Primary line'} · {thread.phone_number || 'Unassigned number'}
                      </p>
                      <p className="text-xs text-primary-dark/60">
                        Last message {formatTimestamp(thread.last_message_at)} · {thread.unread_count} unread
                      </p>
                    </div>
                    {optedOut ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-700">
                        Opted out ({optedOutChannels})
                      </span>
                    ) : quietNow ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800">
                        Quiet hours active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Messaging enabled
                      </span>
                    )}
                  </header>

                  {threadMessages.length === 0 ? (
                    <p className="mt-4 rounded-2xl border border-dashed border-primary-dark/20 bg-white px-4 py-5 text-sm text-primary-dark/70">
                      No messages in this thread yet.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {threadMessages.map((message) => (
                        <li
                          key={message.id}
                          className="rounded-2xl border border-primary-dark/10 bg-white px-4 py-3 text-sm text-primary-dark"
                        >
                          <div className="flex items-center justify-between text-xs text-primary-dark/60">
                            <span className="font-semibold uppercase tracking-[0.2em]">
                              {message.direction === 'out' ? 'Sent' : 'Received'} · {message.channel.toUpperCase()}
                            </span>
                            <span>{formatTimestamp(message.created_at)}</span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-primary-dark">{message.body || '—'}</p>
                          {message.status && (
                            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-primary-dark/60">
                              Status: {message.status}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
