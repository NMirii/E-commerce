import { getCart } from "@/app/actions/cart";
import { getSession } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { redirect } from "next/navigation";
import CartView from "./CartView";

export default async function CartPage() {
  if (!hasSupabaseEnv()) return null;

  const session = await getSession();
  if (!session) redirect("/login");

  const cart = await getCart();

  return (
    <div className="container-app section-padding">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Səbət</h1>
      <CartView initialCart={cart} />
    </div>
  );
}
