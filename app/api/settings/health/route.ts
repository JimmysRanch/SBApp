import { NextResponse } from "next/server";

export async function GET(){
  return NextResponse.json({
    mode: (process.env.SUPABASE_SERVICE_ROLE_KEY ? "service-role" : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "anon+RLS" : "none")),
    env: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
}
