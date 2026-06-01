import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { createServiceClient } from "@/lib/supabase/service";
import { z } from "zod";
import { errorMessage, zodIssues } from "@/lib/zod-errors";

const orderSchema = z.object({
  shipping_address: z.string().min(5),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiSession(request);
    if (session instanceof NextResponse) return session;

    const supabase = createServiceClient();

    let query = supabase.from("orders").select(`
      id, total, status, shipping_address, created_at,
      profiles (full_name, email),
      order_items (id, quantity, price, product_id)
    `);

    if (!["admin", "manager"].includes(session.role)) {
      query = query.eq("user_id", session.userId);
    }

    const { data: orders, error } = await query.order("created_at", {
      ascending: false,
    });
    if (error) throw error;

    return NextResponse.json(orders);
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireApiSession(request);
    if (session instanceof NextResponse) return session;

    const supabase = createServiceClient();
    const body = await request.json();
    const validatedData = orderSchema.parse(body);

    let total = 0;
    const itemsWithDetails = [];

    for (const item of validatedData.items) {
      const { data: product, error: prodError } = await supabase
        .from("products")
        .select("id, price, inventory_count, title, is_active")
        .eq("id", item.product_id)
        .single();

      if (prodError || !product || !product.is_active) {
        return NextResponse.json(
          { error: `Product not found or inactive: ${item.product_id}` },
          { status: 404 }
        );
      }

      if (product.inventory_count < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient inventory for: ${product.title}` },
          { status: 400 }
        );
      }

      total += Number(product.price) * item.quantity;
      itemsWithDetails.push({
        product_id: product.id,
        quantity: item.quantity,
        price: product.price,
        current_inventory: product.inventory_count,
      });
    }

    for (const item of itemsWithDetails) {
      const { error: updateError } = await supabase
        .from("products")
        .update({ inventory_count: item.current_inventory - item.quantity })
        .eq("id", item.product_id);
      if (updateError) throw updateError;
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: session.userId,
        total,
        status: "pending",
        shipping_address: validatedData.shipping_address,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = itemsWithDetails.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) throw itemsError;

    await supabase.from("audit_logs").insert({
      user_id: session.userId,
      action_type: "ORDER_CREATION",
      details: { order_id: order.id, total, items_count: orderItems.length },
    });

    return NextResponse.json(order, { status: 201 });
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
