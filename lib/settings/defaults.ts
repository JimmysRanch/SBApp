import { SettingsPayload } from "./types";
export const DEFAULTS: SettingsPayload = {
  version: 1,
  org: {
    general: { name: "", timezone: "America/Chicago", weekStart: "Mon" },
    scheduling: { slotMinutes: 15, overlap: "disallow", autoAssign: "revenue-balance" },
    payroll: { frequency: "biweekly", payday: "Friday", periodStart: "Monday" },
    theme: { mode: "light", motion: "standard", background: "static", brand:{primary:"#0B6", accent:"#FF8A00"} }
  },
  location: {},
  role: {},
  user: {},
  device: {}
};
