export function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
export function endOfDay(d: Date) { const x = new Date(d); x.setHours(23,59,59,999); return x; }
export function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
export function startOfWeek(d: Date) {
  const x = new Date(d); const day = (x.getDay()+6)%7; // Monday=0
  x.setDate(x.getDate()-day); x.setHours(0,0,0,0); return x;
}
export function endOfWeek(d: Date) {
  const start = startOfWeek(d);
  const end = addDays(start, 6);
  end.setHours(23,59,59,999);
  return end;
}
export function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
export function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59,999); }
export function fmt(d: Date) { return d.toISOString(); }
export function sameDay(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}
