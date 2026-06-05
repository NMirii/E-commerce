import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";

export default async function AccountPage() {
  if (!hasSupabaseEnv()) return null;

  const session = await getSession();
  if (!session) redirect("/login");

  const db = createServiceClient();

  const { data: ordersData } = await db
    .from("orders")
    .select("id, total, status, created_at")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  const orders = (ordersData ?? []) as Array<{
    id: string;
    total: number;
    status: string;
    created_at: string;
  }>;

  const isStaff = session.role === "admin" || session.role === "manager";

  return (
    <div className="container-app section-padding">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Hesabım</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="surface-card p-6 h-fit">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-4 bg-emerald-100 text-emerald-800">
              {(session.fullName || session.email || "U")[0].toUpperCase()}
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {session.fullName || "Müştəri"}
            </h2>
            <p className="text-sm mt-1 text-muted">{session.email}</p>
            <span className={`badge mt-4 ${isStaff ? "badge-green" : "badge-processing"}`}>
              {session.role === "admin"
                ? "Admin"
                : session.role === "manager"
                  ? "Manager"
                  : "Müştəri"}
            </span>

            <div className="w-full pt-6 mt-6 border-t border-slate-100 space-y-2">
              {isStaff && (
                <Link href="/admin" className="w-full btn-secondary py-2.5 text-center block text-sm">
                  Admin panel
                </Link>
              )}
              <form action={signOut}>
                <button type="submit" className="w-full btn-danger py-2">
                  Çıxış
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 surface-card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Sifarişlərim</h3>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p className="mb-4">Hələ sifariş yoxdur.</p>
              <Link href="/" className="btn-primary text-sm">
                Mağazaya get
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-lg border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div>
                    <p className="text-xs text-muted font-mono">#{order.id.slice(0, 8)}</p>
                    <p className="text-base font-bold text-slate-900 mt-1 tabular-nums">
                      {Number(order.total).toFixed(2)} AZN
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {new Date(order.created_at).toLocaleDateString("az-AZ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge badge-${order.status}`}>
                      {order.status === "pending"
                        ? "Gözləyir"
                        : order.status === "processing"
                          ? "İşlənir"
                          : order.status === "shipped"
                            ? "Göndərilib"
                            : order.status === "delivered"
                              ? "Çatdırılıb"
                              : "Ləğv"}
                    </span>
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-sm font-medium text-emerald-600 hover:underline"
                    >
                      Ətraflı
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
