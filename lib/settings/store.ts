import fs from "node:fs";
import path from "node:path";
import { DEFAULTS } from "./defaults";
import { PRECEDENCE, ResolvedSettings, Scope, ScopedSettingsLayer, SettingsPayload } from "./types";
import { normalizeAndFix } from "./normalize";
import { haveSR, getViaSR, upsertViaSR, getViaAnonRLS } from "./sb-clients";

// JSON fallback for local dev
const FALLBACK_PATH = path.join(process.cwd(), ".data-settings.json");

function readFallback(): SettingsPayload|null { try{ return JSON.parse(fs.readFileSync(FALLBACK_PATH,"utf8")); } catch { return null; } }
function writeFallback(payload: SettingsPayload){ fs.mkdirSync(path.dirname(FALLBACK_PATH),{recursive:true}); fs.writeFileSync(FALLBACK_PATH, JSON.stringify(payload,null,2)); }

export async function getSettings(): Promise<SettingsPayload> {
  let raw:any = null;
  try {
    raw = haveSR() ? await getViaSR() : await getViaAnonRLS();
  } catch {}
  if (!raw) raw = readFallback();
  if (!raw) raw = DEFAULTS;
  const fixed = normalizeAndFix(raw);
  try {
    if (haveSR()) await upsertViaSR(fixed); else writeFallback(fixed);
  } catch {}
  return fixed;
}
export async function saveSettings(next: any){
  const fixed = normalizeAndFix(next);
  try {
    if (haveSR()) await upsertViaSR(fixed); else writeFallback(fixed);
  } catch {
    writeFallback(fixed);
  }
  return fixed;
}

export function resolveSettings(base: SettingsPayload, scopeInput?: Partial<Record<Scope,string>>): ResolvedSettings {
  const out = structuredClone(base.org);
  for (const scope of [...PRECEDENCE].reverse()){
    const id = scopeInput?.[scope];
    if (!id) continue;
    const layer = (base as any)[scope]?.[id] as ScopedSettingsLayer | undefined;
    if (!layer) continue;
    for (const key of Object.keys(layer) as (keyof ResolvedSettings)[]) {
      const patch = layer[key];
      if (!patch) continue;
      out[key] = { ...(out as any)[key], ...(patch as Record<string, unknown>) };
    }
  }
  return out;
}
