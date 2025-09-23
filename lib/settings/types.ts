export type Scope = "org" | "location" | "role" | "user" | "device";
export const PRECEDENCE: Scope[] = ["device","user","role","location","org"];
export type WeekStart = "Mon" | "Sun";
export type PayrollFrequency = "weekly" | "biweekly" | "semimonthly" | "monthly";
export type Payday = "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday";
export type ThemeMode = "light"|"dark"|"auto";
export type MotionPref = "standard"|"reduced";
export type BackgroundStyle = "static"|"parallax"|"liquid";
export interface GeneralSettings { name: string; timezone: string; weekStart: WeekStart; }
export interface SchedulingSettings { slotMinutes: 5|10|15|20|30; overlap: "disallow"|"warn"|"allow"; autoAssign: "revenue-balance"|"round-robin"|"preference"; }
export interface PayrollSettings { frequency: PayrollFrequency; payday: Payday; periodStart: "Monday"|"Sunday"; }
export interface ThemeSettings { mode: ThemeMode; motion: MotionPref; background: BackgroundStyle; brand: { primary: string; accent: string; }; }
export type ScopedSettingsLayer = Partial<{
  general: Partial<GeneralSettings>;
  scheduling: Partial<SchedulingSettings>;
  payroll: Partial<PayrollSettings>;
  theme: Partial<ThemeSettings>;
}>;
export interface SettingsPayload {
  version: number;
  org: { general: GeneralSettings; scheduling: SchedulingSettings; payroll: PayrollSettings; theme: ThemeSettings; };
  location: Record<string, ScopedSettingsLayer>;
  role: Record<string, ScopedSettingsLayer>;
  user: Record<string, ScopedSettingsLayer>;
  device: Record<string, ScopedSettingsLayer>;
}
export type ResolvedSettings = SettingsPayload["org"];
export interface SettingChange { timestamp: string; actorUserId: string; scope: Scope; scopeId?: string; path: string; old?: unknown; new: unknown; }
