import { getSession, hasRole } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import SupabaseSetupNotice from "@/components/SupabaseSetupNotice";
import { updateOrderStatusAction } from "@/app/actions/orders";
import { redirect } from "next/navigation";
import { resolveNested } from "@/lib/cart-utils";
import type { ProfileSnippet } from "@/lib/types";

interface OrderItemRow {
  id: string;
  quantity: number;
  price: number;
  products: { title: string } | { title: string }[] | null;
}

interface AdminOrderRow {
  id: string;
  status: string;
  total: number;
  created_at: string;
  shipping_address: string;
  profiles: ProfileSnippet | ProfileSnippet[] | null;
  order_items: OrderItemRow[] | null;
}

export default async function AdminOrdersPage() {
  if (!hasSupabaseEnv()) {
    return <SupabaseSetupNotice />;
  }

  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasRole(session, ["admin", "manager"])) redirect("/");

  const supabase = createServiceClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      id, status, total, created_at, shipping_address,
      profiles (full_name, email),
      order_items (
        id, quantity, price,
        products (title)
      )
    `
    )
    .order("created_at", { ascending: false });

  const orderList = (orders ?? []) as AdminOrderRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black page-title">
          Sifarişlərin İdarə Edilməsi
        </h1>
        <p className="text-sm mt-1 text-muted">
          Müştəri sifarişlərini izləyin və onların statusunu yeniləyin.
        </p>
      </div>

      {orderList.length === 0 ? (
        <div className="text-center py-20 glass rounded-xl">
          <p className="text-muted">Hələ heç bir sifariş yoxdur.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orderList.map((order) => {
            const customer = resolveNested(order.profiles);
            const items = order.order_items ?? [];

            return (
              <div
                key={order.id}
                className="p-6 rounded-2xl glass glow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-mono text-muted">
                      Sifariş #{order.id.slice(0, 8)}
                    </span>
                    <span className={`badge badge-${order.status}`}>
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
                    <span className="text-xs text-muted">
                      {new Date(order.created_at).toLocaleString("az-AZ")}
                    </span>
                  </div>

                  <div>
                    <h4 className="page-title font-bold">
                      {customer?.full_name || "Müştəri"} ({customer?.email})
                    </h4>
                    <p className="text-xs mt-1 text-muted">
                      Ünvan: {order.shipping_address || "Qeyd edilməyib"}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs space-y-1 max-w-lg">
                    <span className="font-bold block mb-1 text-emerald-700">
                      Məhsullar:
                    </span>
                    {items.map((item) => {
                      const product = resolveNested(item.products);
                      return (
                        <div key={item.id} className="flex justify-between gap-4">
                          <span className="text-green-900">
                            {product?.title || "Məhsul"}
                          </span>
                          <span className="font-semibold text-emerald-600">
                            {item.quantity} ədəd x {item.price} AZN
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-dashed border-emerald-100">
                  <div className="text-right w-full">
                    <span className="text-[10px] uppercase font-bold tracking-wider block text-muted">
                      Ümumi Məbləğ
                    </span>
                    <span className="text-xl font-black text-emerald-600">
                      {order.total} AZN
                    </span>
                  </div>

                  <form
                    action={updateOrderStatusAction}
                    className="flex gap-2 w-full justify-end"
                  >
                    <input type="hidden" name="orderId" value={order.id} />
                    <select
                      name="status"
                      defaultValue={order.status}
                      className="input-field py-1.5 px-3 text-xs w-fit"
                    >
                      <option value="pending">Gözləyir</option>
                      <option value="processing">İşlənir</option>
                      <option value="shipped">Göndərilib</option>
                      <option value="delivered">Çatdırılıb</option>
                      <option value="cancelled">Ləğv edilib</option>
                    </select>
                    <button
                      type="submit"
                      className="btn-primary py-1.5 px-4 text-xs font-bold"
                    >
                      Yenilə
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
