import { getSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { resolveNested } from "@/lib/cart-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface OrderItemRow {
  id: string;
  quantity: number;
  price: number;
  products: { title: string; image_url: string | null } | { title: string; image_url: string | null }[] | null;
}

export default async function OrderDetailPage({ params }: RouteParams) {
  if (!hasSupabaseEnv()) return null;

  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = createServiceClient();

  const { data: orderData } = await supabase
    .from("orders")
    .select(
      `
      id, total, status, shipping_address, created_at,
      order_items (
        id, quantity, price,
        products (title, image_url)
      )
    `
    )
    .eq("id", id)
    .eq("user_id", session.userId)
    .single();

  if (!orderData) {
    notFound();
  }

  const order = orderData as {
    id: string;
    total: number;
    status: string;
    shipping_address: string;
    created_at: string;
    order_items: OrderItemRow[] | null;
  };

  const items = order.order_items ?? [];

  return (
    <div className="container-app section-padding max-w-3xl">
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 text-xs font-semibold mb-8 text-muted hover:text-emerald-600 transition-colors"
      >
        ← Hesabıma geri dön
      </Link>

      <div className="p-8 rounded-2xl glass glow-sm anim-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-emerald-100">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-muted">
              Qəbz
            </span>
            <h1 className="text-2xl font-black page-title mt-1">
              Sifariş #{order.id.slice(0, 8)}
            </h1>
            <p className="text-xs mt-1 text-muted">
              Tarix: {new Date(order.created_at).toLocaleString("az-AZ")}
            </p>
          </div>
          <span className={`badge badge-${order.status} text-sm py-1 px-3`}>
            {order.status === "pending"
              ? "Gözləyir"
              : order.status === "processing"
                ? "İşlənir"
                : order.status === "shipped"
                  ? "Göndərilib"
                  : order.status === "delivered"
                    ? "Çatdırılıb"
                    : "Ləğv edilib"}
          </span>
        </div>

        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2 label-text">
            Çatdırılma Ünvanı
          </h3>
          <p className="text-sm p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-green-900">
            {order.shipping_address}
          </p>
        </div>

        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-3 label-text">
            Məhsullar
          </h3>
          <div className="space-y-3">
            {items.map((item) => {
              const product = resolveNested(item.products);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg text-sm bg-white border border-emerald-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold page-title">
                      {product?.title || "Məhsul"}
                    </span>
                    <span className="text-muted">x {item.quantity}</span>
                  </div>
                  <span className="font-bold text-emerald-600">
                    {item.price * item.quantity} AZN
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-emerald-100">
          <span className="text-base font-bold page-title">Ümumi Cəm:</span>
          <span className="text-2xl font-black text-emerald-600">{order.total} AZN</span>
        </div>
      </div>
    </div>
  );
}
