import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiRole } from "@/lib/auth/api";
import { createServiceClient } from "@/lib/supabase/service";
import { z } from "zod";
import { errorMessage, zodIssues } from "@/lib/zod-errors";

const updateProductSchema = z.object({
  title: z.string().min(3).optional(),
  price: z.number().positive().optional(),
  inventory_count: z.number().int().nonnegative().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  image_url: z.string().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireApiRole(request, ["admin", "manager"]);
    if (session instanceof NextResponse) return session;

    const { id } = await context.params;
    const supabase = createServiceClient();
    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    const { data: product, error } = await supabase
      .from("products")
      .update(validatedData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      user_id: session.userId,
      action_type: "PRODUCT_MUTATION",
      details: { product_id: id, action: "api_update", changes: validatedData },
    });

    return NextResponse.json(product);
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

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireApiRole(request, ["admin", "manager"]);
    if (session instanceof NextResponse) return session;

    const { id } = await context.params;
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      user_id: session.userId,
      action_type: "PRODUCT_MUTATION",
      details: { product_id: id, action: "api_soft_delete" },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
