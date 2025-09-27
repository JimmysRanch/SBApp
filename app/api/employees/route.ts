import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  
  // Authentication
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  // Get user's business_id for proper scoping
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", uid)
    .single();

  if (profileError || !profile?.business_id) {
    return NextResponse.json({ error: 'Business access required' }, { status: 403 });
  }

  // Check permissions
  const { data: canManage } = await supabase.rpc('has_perm', { _uid: uid, _perm: 'manage_staff' });
  if (!canManage) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  // Parse pagination parameters
  const page = Number(searchParams.get("page") || "1");
  const size = Math.min(Number(searchParams.get("size") || "20"), 100); // Max 100 per page
  const offset = (page - 1) * size;

  // Parse filters
  const search = searchParams.get("search")?.trim() || undefined;
  const status = searchParams.get("status") || "all"; // all, active, inactive
  const orderBy = searchParams.get("orderBy") || "name"; // name, created_at
  const order = searchParams.get("order") === "desc" ? "desc" : "asc";

  try {
    // Build query with business_id scoping
    let query = supabase
      .from("employees")
      .select("id,name,email,phone,status,active,avatar_url,role,created_at", { count: 'exact' })
      .eq("business_id", profile.business_id);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (status !== "all") {
      if (status === "active") {
        query = query.eq("active", true);
      } else if (status === "inactive") {
        query = query.eq("active", false);
      }
    }

    // Apply ordering
    const validOrderFields = ["name", "created_at", "email"];
    const orderField = validOrderFields.includes(orderBy) ? orderBy : "name";
    query = query.order(orderField, { ascending: order === "asc" });

    // Apply pagination
    query = query.range(offset, offset + size - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      data: data ?? [],
      pagination: {
        page,
        size,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / size),
        hasNext: (count || 0) > offset + size,
        hasPrev: page > 1
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to list employees" }, { status: 500 });
  }
}