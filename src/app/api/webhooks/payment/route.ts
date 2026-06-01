import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorMessage } from "@/lib/zod-errors";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Simulating Stripe webhook payload structure
    const { order_id, status } = body;

    if (!order_id || !status) {
      return NextResponse.json({ error: "Missing order_id or status" }, { status: 400 });
    }

    if (status === "paid") {
      // Transition status to 'processing'
      const { error } = await supabase
        .from("orders")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", order_id)
        .select()
        .single();

      if (error) throw error;

      // System audit log
      await supabase.from("audit_logs").insert({
        action_type: "ORDER_STATUS_CHANGE",
        details: { order_id, status: "processing", source: "payment_webhook_stripe" },
      });

      return NextResponse.json({ success: true, message: `Order ${order_id} transitioned to processing.` });
    }

    return NextResponse.json({ success: true, message: "Webhook received, no actions taken." });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
