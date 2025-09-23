import fs from "node:fs";
import path from "node:path";
import { DEFAULTS } from "./defaults";
import { PRECEDENCE, ResolvedSettings, Scope, ScopedSettingsLayer, SettingsPayload } from "./types";
import { normalizeAndFix } from "./normalize";
import { haveSR, getViaSR, upsertViaSR, getViaAnonRLS, haveAnon } from "./sb-clients";

// JSON fallback for local dev
const FALLBACK_PATH = path.join(process.cwd(), ".data-settings.json");

type SettingsSource = "service-role" | "anon+RLS" | "file" | "defaults" | "unknown";
type PersistTarget = "service-role" | "file" | "none";

interface SettingsMeta {
  lastReadSource: SettingsSource;
  lastPersistTarget: PersistTarget;
  readErrors: Partial<Record<Exclude<SettingsSource, "defaults" | "unknown">, string>>;
  writeError?: string;
}

const meta: SettingsMeta = {
  lastReadSource: "unknown",
  lastPersistTarget: "none",
  readErrors: {},
  writeError: undefined,
};

function readFallback(): { data: SettingsPayload | null; error?: string } {
  try {
    const raw = fs.readFileSync(FALLBACK_PATH, "utf8");
    return { data: JSON.parse(raw) };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") return { data: null };
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

function writeFallback(payload: SettingsPayload): { ok: boolean; error?: string } {
  try {
    fs.mkdirSync(path.dirname(FALLBACK_PATH), { recursive: true });
    fs.writeFileSync(FALLBACK_PATH, JSON.stringify(payload, null, 2));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function formatError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function getSettingsMeta(): SettingsMeta {
  return {
    lastReadSource: meta.lastReadSource,
    lastPersistTarget: meta.lastPersistTarget,
    readErrors: { ...meta.readErrors },
    writeError: meta.writeError,
  };
}

export async function getSettings(): Promise<SettingsPayload> {
  const readErrors: SettingsMeta["readErrors"] = {};
  let source: SettingsSource = "unknown";
  let raw: any = null;

  if (haveSR()) {
    try {
      const viaSR = await getViaSR();
      if (viaSR) {
        raw = viaSR;
        source = "service-role";
      }
    } catch (err) {
      readErrors["service-role"] = formatError(err);
    }
  }

  if (!raw && haveAnon()) {
    try {
      const viaAnon = await getViaAnonRLS();
      if (viaAnon) {
        raw = viaAnon;
        source = "anon+RLS";
      }
    } catch (err) {
      readErrors["anon+RLS"] = formatError(err);
    }
  }

  if (!raw) {
    const fallback = readFallback();
    if (fallback.data) {
      raw = fallback.data;
      source = "file";
    }
    if (fallback.error) {
      readErrors["file"] = fallback.error;
    }
  }

  if (!raw) {
    raw = DEFAULTS;
    source = "defaults";
  }

  const fixed = normalizeAndFix(raw);
  const hasSR = haveSR();
  let persistTarget: PersistTarget = "none";
  let writeError: string | undefined;

  if (hasSR) {
    try {
      await upsertViaSR(fixed);
      persistTarget = "service-role";
    } catch (err) {
      writeError = `service-role: ${formatError(err)}`;
      const fallbackWrite = writeFallback(fixed);
      if (!fallbackWrite.ok && fallbackWrite.error) {
        writeError += `; file: ${fallbackWrite.error}`;
      } else if (fallbackWrite.ok) {
        persistTarget = "file";
      }
    }
  } else {
    const fallbackWrite = writeFallback(fixed);
    if (!fallbackWrite.ok && fallbackWrite.error) {
      writeError = `file: ${fallbackWrite.error}`;
    } else {
      persistTarget = "file";
    }
  }

  meta.lastReadSource = source;
  meta.lastPersistTarget = persistTarget;
  meta.readErrors = readErrors;
  meta.writeError = writeError;

  return fixed;
}

export async function saveSettings(next: any) {
  const fixed = normalizeAndFix(next);
  const hasSR = haveSR();
  let persistTarget: PersistTarget = "none";
  let writeError: string | undefined;

  if (hasSR) {
    try {
      await upsertViaSR(fixed);
      persistTarget = "service-role";
    } catch (err) {
      writeError = `service-role: ${formatError(err)}`;
      const fallbackWrite = writeFallback(fixed);
      if (!fallbackWrite.ok && fallbackWrite.error) {
        writeError += `; file: ${fallbackWrite.error}`;
      } else if (fallbackWrite.ok) {
        persistTarget = "file";
      }
    }
  } else {
    const fallbackWrite = writeFallback(fixed);
    if (!fallbackWrite.ok && fallbackWrite.error) {
      writeError = `file: ${fallbackWrite.error}`;
    } else {
      persistTarget = "file";
    }
  }

  meta.lastPersistTarget = persistTarget;
  meta.writeError = writeError;

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
