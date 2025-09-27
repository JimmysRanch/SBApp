export type QuietHoursSetting = { enabled: boolean; start: string; end: string };
export type TimezoneSetting = { iana: string };

export function inQuietHoursLocal(
  quiet: QuietHoursSetting | null,
  tz: TimezoneSetting | null,
  now: Date = new Date()
): boolean {
  if (!quiet || !quiet.enabled) return false;
  const zone = tz?.iana || 'America/Chicago';

  const fmt = new Intl.DateTimeFormat('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    timeZone: zone,
  });
  const parts = fmt.formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value || '0');
  const m = Number(parts.find((p) => p.type === 'minute')?.value || '0');
  const current = h * 60 + m;

  const [sh, sm] = quiet.start.split(':').map((n) => parseInt(n, 10) || 0);
  const [eh, em] = quiet.end.split(':').map((n) => parseInt(n, 10) || 0);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;

  if (start === end) return false;
  if (start < end) return current >= start && current < end;
  return current >= start || current < end;
}
