import { describe, it, expect } from "vitest";
import { DEFAULTS } from "@/lib/settings/defaults";
import { resolveSettings } from "@/lib/settings/store";

describe("resolveSettings precedence", () => {
  it("device > user > role > location > org", () => {
    const base = structuredClone(DEFAULTS);
    base.location["loc1"] = { scheduling: { slotMinutes: 10 } };
    base.role["Groomer"]  = { scheduling: { slotMinutes: 20 } };
    base.user["u1"]       = { scheduling: { slotMinutes: 30 } };
    base.device["ipadA"]  = { scheduling: { slotMinutes: 5 } };
    const r = resolveSettings(base, { location:"loc1", role:"Groomer", user:"u1", device:"ipadA" });
    expect(r.scheduling.slotMinutes).toBe(5);
  });
});
