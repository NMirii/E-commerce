"use server";

import { getAuthenticatedDb } from "@/lib/auth/context";
import { getSession, hasRole } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { zodFirstMessage } from "@/lib/zod-errors";
import { getCart } from "@/app/actions/cart";
import { resolveCartProduct } from "@/lib/cart-utils";

const orderStatusSchema = z.enum([
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

const checkoutSchema = z.object({
  shipping_address: z.string().min(5, "Çatdırılma ünvanı ən az 5 simvol olmalıdır"),
});

export type OrderActionState = { error?: string; success?: boolean } | undefined;

export async function placeOrderAction(
  _prev: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  try {
    const shipping_address = formData.get("shipping_address") as string;
    checkoutSchema.parse({ shipping_address });

    const auth = await getAuthenticatedDb();
    if (!auth) return { error: "Giriş tələb olunur" };
    const { session, db: supabase } = auth;

    const cart = await getCart();
    if (!cart.length) return { error: "Səbətiniz boşdur" };

    for (const item of cart) {
      const product = resolveCartProduct(item.products);
      if (!product) return { error: "Səbətdə etibarsız məhsul var" };

      const { data: dbProduct } = await supabase
        .from("products")
        .select("inventory_count, title, is_active")
        .eq("id", product.id)
        .single();

      if (!dbProduct?.is_active) {
        return { error: `Məhsul aktiv deyil: ${product.title}` };
      }
      if ((dbProduct.inventory_count ?? 0) < item.quantity) {
        return {
          error: `Kifayət qədər stok yoxdur: "${dbProduct.title}"`,
        };
      }
    }

    for (const item of cart) {
      const product = resolveCartProduct(item.products);
      if (!product) return { error: "Səbətdə etibarsız məhsul var" };

      const { data: dbProduct } = await supabase
        .from("products")
        .select("inventory_count")
        .eq("id", product.id)
        .single();

      const newStock = (dbProduct?.inventory_count ?? 0) - item.quantity;
      const { error: stockErr } = await supabase
        .from("products")
        .update({ inventory_count: newStock })
        .eq("id", product.id)
        .gte("inventory_count", item.quantity);

      if (stockErr) {
        return { error: "Stok yenilənərkən xəta baş verdi. Yenidən cəhd edin." };
      }
    }

    const total = cart.reduce((sum, item) => {
      const p = resolveCartProduct(item.products);
      return sum + (p?.price ?? 0) * item.quantity;
    }, 0);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: session.userId,
        total,
        status: "pending",
        shipping_address,
      })
      .select()
      .single();

    if (orderError) return { error: orderError.message };

    const orderItems = cart
      .map((item) => {
        const p = resolveCartProduct(item.products);
        if (!p) return null;
        return {
          order_id: order.id,
          product_id: p.id,
          quantity: item.quantity,
          price: p.price,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);
    if (itemsError) return { error: itemsError.message };

    await supabase.from("audit_logs").insert({
      user_id: session.userId,
      action_type: "ORDER_CREATION",
      details: { order_id: order.id, total, source: "server_action" },
    });

    await supabase.from("cart_items").delete().eq("user_id", session.userId);

    revalidatePath("/orders");
    revalidatePath("/cart");
    redirect(`/orders/${order.id}`);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { error: zodFirstMessage(err) };
    }
    if (err && typeof err === "object" && "digest" in err) {
      throw err;
    }
    return {
      error: err instanceof Error ? err.message : "Sifariş yaradıla bilmədi",
    };
  }
}

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !hasRole(session, ["admin", "manager"])) return;

  const supabase = createServiceClient();

  const orderId = formData.get("orderId") as string;
  const status = orderStatusSchema.parse(formData.get("status"));

  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) return;

  await supabase.from("audit_logs").insert({
    user_id: session.userId,
    action_type: "ORDER_STATUS_CHANGE",
    details: { order_id: orderId, status },
  });

  revalidatePath("/admin/order");
  revalidatePath("/orders");
}
