import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiRole } from "@/lib/auth/api";
import { createServiceClient } from "@/lib/supabase/service";
import { z } from "zod";
import { errorMessage, zodIssues } from "@/lib/zod-errors";

const productSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  inventory_count: z.number().int().nonnegative(),
  category: z.string().min(1),
  image_url: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const includeAll = searchParams.get("all") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50", 10));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    if (includeAll) {
      const auth = await requireApiRole(request, ["admin", "manager"]);
      if (auth instanceof NextResponse) return auth;
    }

    const supabase = includeAll ? createServiceClient() : await createClient();

    let query = supabase.from("products").select("*", { count: "exact" });

    if (!includeAll) {
      query = query.eq("is_active", true);
    }

    if (search) query = query.ilike("title", `%${search}%`);
    if (category) query = query.eq("category", category);

    const { data: products, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw error;

    return NextResponse.json({
      products,
      page,
      limit,
      total: count,
      hasMore: count ? from + limit < count : false,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireApiRole(request, ["admin", "manager"]);
    if (session instanceof NextResponse) return session;

    const supabase = createServiceClient();
    const body = await request.json();
    const validatedData = productSchema.parse(body);

    const { data: product, error } = await supabase
      .from("products")
      .insert(validatedData)
      .select()
      .single();

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      user_id: session.userId,
      action_type: "PRODUCT_MUTATION",
      details: { product_id: product.id, action: "api_create", data: validatedData },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation Error", details: zodIssues(error) },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
