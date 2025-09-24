export const MINUTE = 60 * 1000;

export function toDate(value: string | Date): Date {
  return value instanceof Date ? new Date(value.getTime()) : new Date(value);
}

export function addMinutes(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * MINUTE);
}

export function differenceInMinutes(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / MINUTE);
}

export function clampDate(value: Date, { min, max }: { min?: Date; max?: Date }): Date {
  let time = value.getTime();
  if (min && time < min.getTime()) time = min.getTime();
  if (max && time > max.getTime()) time = max.getTime();
  return new Date(time);
}
