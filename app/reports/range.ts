export const RANGE_OPTIONS = ['today', 'week', 'month', 'year', 'all'] as const;

export type RangeOption = (typeof RANGE_OPTIONS)[number];

export const RANGE_LABELS: Record<RangeOption, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
  all: 'All Time',
};

export function parseRangeParam(value: string | string[] | undefined): RangeOption {
  if (!value) return 'today';
  const first = Array.isArray(value) ? value[0] : value;
  if (!first) return 'today';
  return RANGE_OPTIONS.includes(first as RangeOption) ? (first as RangeOption) : 'today';
}
