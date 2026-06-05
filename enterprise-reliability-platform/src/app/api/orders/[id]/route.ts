import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { createServiceClient } from "@/lib/supabase/service";
import { z } from "zod";
import { errorMessage, zodIssues } from "@/lib/zod-errors";

const updateOrderSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireApiRole(request, ["admin", "manager"]);
    if (session instanceof NextResponse) return session;

    const { id } = await context.params;
    const supabase = createServiceClient();
    const body = await request.json();
    const validatedData = updateOrderSchema.parse(body);

    const { data: order, error } = await supabase
      .from("orders")
      .update({
        status: validatedData.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      user_id: session.userId,
      action_type: "ORDER_STATUS_CHANGE",
      details: { order_id: id, status: validatedData.status },
    });

    return NextResponse.json(order);
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
