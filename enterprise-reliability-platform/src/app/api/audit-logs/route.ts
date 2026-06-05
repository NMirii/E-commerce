import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiRole(request, ["admin", "manager"]);
    if (session instanceof NextResponse) return session;

    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "15", 10));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("audit_logs")
      .select("id, action_type, details, created_at, user_id", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      logs: data,
      page,
      hasMore: count ? from + limit < count : false,
      total: count,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
