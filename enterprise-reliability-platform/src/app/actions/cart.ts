"use server";

import { getAuthenticatedDb } from "@/lib/auth/context";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveCartProduct } from "@/lib/cart-utils";
import type { CartItemView } from "@/lib/types";

export async function addToCart(productId: string, quantity = 1) {
  const auth = await getAuthenticatedDb();
  if (!auth) return { error: "Səbətə əlavə etmək üçün daxil olun" };

  const { session, db } = auth;
  const { data: existing } = await db
    .from("cart_items")
    .select("quantity")
    .eq("user_id", session.userId)
    .eq("product_id", productId)
    .maybeSingle();

  const newQuantity = (existing?.quantity ?? 0) + quantity;

  const { error } = await db.from("cart_items").upsert(
    { user_id: session.userId, product_id: productId, quantity: newQuantity },
    { onConflict: "user_id,product_id" }
  );

  if (error) return { error: error.message };
  revalidatePath("/cart");
  return { success: true };
}

export async function getCart(): Promise<CartItemView[]> {
  const auth = await getAuthenticatedDb();
  if (!auth) return [];

  const { data } = await auth.db
    .from("cart_items")
    .select(
      `
      id,
      quantity,
      products (id, title, price, image_url)
    `
    )
    .eq("user_id", auth.session.userId);

  return (data ?? []).map((item) => ({
    id: item.id,
    quantity: item.quantity,
    products: resolveCartProduct(item.products),
  }));
}

export type CheckoutResult = { error?: string } | void;

export async function checkoutCart(
  shippingAddress: string
): Promise<CheckoutResult> {
  if (!shippingAddress || shippingAddress.trim().length < 5) {
    return {
      error:
        "Zəhmət olmasa, düzgün çatdırılma ünvanı qeyd edin (ən az 5 simvol).",
    };
  }

  const auth = await getAuthenticatedDb();
  if (!auth) return { error: "Giriş tələb olunur." };

  const { session, db } = auth;
  const cart = await getCart();
  if (!cart.length) return { error: "Səbətiniz boşdur." };

  for (const item of cart) {
    const product = item.products;
    if (!product) return { error: "Səbətdə etibarsız məhsul var" };

    const { data: dbProduct, error: prodError } = await db
      .from("products")
      .select("inventory_count, title, is_active")
      .eq("id", product.id)
      .single();

    if (prodError || !dbProduct?.is_active) {
      return { error: `Məhsul tapılmadı və ya aktiv deyil: ${product.title}` };
    }

    if (dbProduct.inventory_count < item.quantity) {
      return {
        error: `Kifayət qədər stok yoxdur: "${dbProduct.title}" (Stokda: ${dbProduct.inventory_count}, Səbət: ${item.quantity})`,
      };
    }
  }

  for (const item of cart) {
    const product = item.products!;
    const { data: dbProduct } = await db
      .from("products")
      .select("inventory_count")
      .eq("id", product.id)
      .single();

    const newStock = (dbProduct?.inventory_count ?? 0) - item.quantity;
    const { error: stockErr } = await db
      .from("products")
      .update({ inventory_count: newStock })
      .eq("id", product.id)
      .gte("inventory_count", item.quantity);

    if (stockErr) {
      return { error: "Stok yenilənərkən xəta baş verdi. Yenidən cəhd edin." };
    }
  }

  const total = cart.reduce((sum, item) => {
    return sum + (item.products?.price ?? 0) * item.quantity;
  }, 0);

  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      user_id: session.userId,
      total,
      status: "pending",
      shipping_address: shippingAddress.trim(),
    })
    .select()
    .single();

  if (orderError) return { error: orderError.message };

  const orderItems = cart
    .map((item) => {
      if (!item.products) return null;
      return {
        order_id: order.id,
        product_id: item.products.id,
        quantity: item.quantity,
        price: item.products.price,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const { error: itemsError } = await db.from("order_items").insert(orderItems);
  if (itemsError) return { error: itemsError.message };

  await db.from("audit_logs").insert({
    user_id: session.userId,
    action_type: "ORDER_CREATION",
    details: {
      order_id: order.id,
      total,
      items_count: orderItems.length,
      source: "cart_checkout",
    },
  });

  await db.from("cart_items").delete().eq("user_id", session.userId);

  revalidatePath("/orders");
  revalidatePath("/cart");
  revalidatePath("/account");
  redirect(`/orders/${order.id}`);
}

export async function removeFromCart(cartItemId: string) {
  const auth = await getAuthenticatedDb();
  if (!auth) return { error: "Giriş tələb olunur." };

  const { error } = await auth.db
    .from("cart_items")
    .delete()
    .eq("id", cartItemId)
    .eq("user_id", auth.session.userId);

  if (error) return { error: error.message };
  revalidatePath("/cart");
  return { success: true };
}

export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number
) {
  if (quantity < 1) return { error: "Say 1-dən az ola bilməz." };

  const auth = await getAuthenticatedDb();
  if (!auth) return { error: "Giriş tələb olunur." };

  const { error } = await auth.db
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId)
    .eq("user_id", auth.session.userId);

  if (error) return { error: error.message };
  revalidatePath("/cart");
  return { success: true };
}
