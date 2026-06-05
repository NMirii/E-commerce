import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { createServiceClient } from "@/lib/supabase/service";
import { errorMessage } from "@/lib/zod-errors";

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiRole(request, ["admin", "manager"]);
    if (session instanceof NextResponse) return session;

    const supabase = createServiceClient();

    const { data: products, error } = await supabase
      .from("products")
      .select("id, title, inventory_count, category")
      .lte("inventory_count", 5)
      .eq("is_active", true)
      .order("inventory_count", { ascending: true });

    if (error) throw error;

    return NextResponse.json(products);
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
