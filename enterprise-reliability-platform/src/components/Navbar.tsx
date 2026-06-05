import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { createServiceClient } from "@/lib/supabase/service";
import type { SessionUser } from "@/lib/auth/types";
import NavbarMobile from "./NavbarMobile";

async function getCartCount(userId: string) {
  const db = createServiceClient();
  const { count } = await db
    .from("cart_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

export default async function Navbar({
  session,
  configured = true,
}: {
  session: SessionUser | null;
  configured?: boolean;
}) {
  const cartCount =
    configured && session ? await getCartCount(session.userId) : 0;
  const isAdmin =
    session?.role === "admin" || session?.role === "manager";

  const navItems = [
    { href: "/", label: "Mağaza" },
    { href: "/orders", label: "Sifarişlər" },
  ];

  return (
    <header className="navbar relative">
      <div className="container-app h-full flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white text-sm font-bold">
            G
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Green<span className="text-emerald-600">Shop</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="btn-ghost">
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="ml-1 px-3 py-2 rounded-lg text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <NavbarMobile items={navItems} isAdmin={isAdmin} />

          <Link href="/cart" className="btn-icon relative" aria-label="Səbət">
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] rounded-full text-[10px] font-bold flex items-center justify-center bg-emerald-600 text-white px-1">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {session ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/account"
                className="hidden sm:flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-slate-200 bg-white hover:border-slate-300 transition-colors"
              >
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {(session.fullName || session.email || "U")[0].toUpperCase()}
                </span>
                <span className="text-sm font-medium text-slate-700 max-w-[7rem] truncate">
                  {session.fullName || session.email.split("@")[0]}
                </span>
              </Link>
              <form action={signOut}>
                <button type="submit" className="btn-ghost text-sm hidden sm:inline-flex">
                  Çıxış
                </button>
              </form>
            </div>
          ) : (
            <Link href="/login" className="btn-primary text-sm py-2 px-4">
              Daxil ol
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
