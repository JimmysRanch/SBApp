import fs from "node:fs";
import path from "node:path";
import { SettingsZ } from "./schema";
import { DEFAULTS } from "./defaults";
import { PRECEDENCE, ResolvedSettings, Scope, ScopedSettingsLayer, SettingsPayload } from "./types";
import { normalizeAndFix } from "./normalize";

// JSON fallback for local dev
const FALLBACK_PATH = path.join(process.cwd(), ".data-settings.json");

function haveSupabaseEnv(){ return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY; }

// Service-role admin fetch for app_settings
async function adminGet(): Promise<SettingsPayload|null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!; const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const res = await fetch(`${url}/rest/v1/app_settings?select=payload&id=eq.1`, { headers:{ apikey:key, Authorization:`Bearer ${key}` } });
  if (!res.ok) return null; const arr = await res.json(); if (!Array.isArray(arr)||arr.length===0) return null; return arr[0]?.payload ?? null;
}
async function adminUpsert(payload: SettingsPayload){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!; const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const body = [{ id: 1, payload }];
  await fetch(`${url}/rest/v1/app_settings`, {
    method:"POST",
    headers:{ apikey:key, Authorization:`Bearer ${key}`, "Content-Type":"application/json", Prefer:"resolution=merge-duplicates" },
    body: JSON.stringify(body)
  });
}

function readFallback(): SettingsPayload|null { try{ return JSON.parse(fs.readFileSync(FALLBACK_PATH,"utf8")); } catch { return null; } }
function writeFallback(payload: SettingsPayload){ fs.mkdirSync(path.dirname(FALLBACK_PATH),{recursive:true}); fs.writeFileSync(FALLBACK_PATH, JSON.stringify(payload,null,2)); }

export async function getSettings(): Promise<SettingsPayload> {
  let data: SettingsPayload | null = null;
  if (haveSupabaseEnv()){
    const raw = await adminGet();
    if (raw){
      try {
        data = SettingsZ.parse(raw);
      } catch {
        data = normalizeAndFix(raw);
        await adminUpsert(data);
      }
    }
  }
  if (!data){
    const raw = readFallback();
    if (raw){
      try {
        data = SettingsZ.parse(raw);
      } catch {
        data = normalizeAndFix(raw);
        writeFallback(data);
      }
    }
  }
  if (!data) data = DEFAULTS;
  return data;
}
export async function saveSettings(next: any){
  const parsed = normalizeAndFix(next);
  if (haveSupabaseEnv()) await adminUpsert(parsed); else writeFallback(parsed);
  return parsed;
}

export function resolveSettings(base: SettingsPayload, scopeInput?: Partial<Record<Scope,string>>): ResolvedSettings {
  const order = [...PRECEDENCE].reverse();
  const out = structuredClone(base.org);
  for (const scope of order){
    if (scope === "org") continue;
    const id = scopeInput?.[scope];
    if (!id) continue;
    const collection = base[scope];
    const layer: ScopedSettingsLayer | undefined = collection?.[id];
    if (!layer) continue;
    for (const key of Object.keys(layer) as (keyof ResolvedSettings)[]) {
      const patch = layer[key]; if (!patch) continue;
      out[key] = { ...(out as any)[key], ...(patch as Record<string, unknown>) };
    }
  }
  return out;
}
