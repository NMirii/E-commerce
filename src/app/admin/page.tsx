import { createServiceClient } from "@/lib/supabase/service";
import { getSession, hasRole } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import SupabaseSetupNotice from "@/components/SupabaseSetupNotice";
import { redirect } from "next/navigation";
import AdminDashboardView from "./AdminDashboardView";
import type { Product, OrderSummary } from "@/lib/types";

export default async function AdminDashboardPage() {
  if (!hasSupabaseEnv()) {
    return <SupabaseSetupNotice />;
  }

  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasRole(session, ["admin", "manager"])) redirect("/");

  const supabase = createServiceClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: orders } = await supabase
    .from("orders")
    .select("id, total, status")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">İdarə paneli</h1>
        <p className="text-sm mt-1 text-muted">
          Məhsulları idarə edin, stok səviyyəsini tənzimləyin və satışları izləyin.
        </p>
      </div>

      <AdminDashboardView
        initialProducts={(products || []) as Product[]}
        initialOrders={(orders || []) as OrderSummary[]}
      />
    </div>
  );
}
