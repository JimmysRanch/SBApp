export function haveSR(){
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY && !!process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function haveAnon(){
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export async function getViaSR() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const r = await fetch(`${url}/rest/v1/app_settings?select=payload&id=eq.1`, { headers:{ apikey:key, Authorization:`Bearer ${key}` } });
  if (!r.ok) throw new Error(`SR GET ${r.status}`);
  const j = await r.json();
  return j?.[0]?.payload ?? null;
}

export async function upsertViaSR(payload:any) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const body = [{ id:1, payload }];
  const r = await fetch(`${url}/rest/v1/app_settings`, {
    method:"POST",
    headers:{ apikey:key, Authorization:`Bearer ${key}`, "Content-Type":"application/json", Prefer:"resolution=merge-duplicates" },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`SR UPSERT ${r.status}`);
}

export async function getViaAnonRLS() {
  const { createClient: createServerClient } = await import("@/lib/supabase/server");
  const supabase = createServerClient();
  const { data, error } = await supabase.from("app_settings").select("payload").eq("id",1).maybeSingle();
  if (error) throw new Error(`RLS GET: ${error.message}`);
  return data?.payload ?? null;
}
