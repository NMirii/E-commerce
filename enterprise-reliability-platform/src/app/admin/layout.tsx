import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-emerald-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 glass border-r border-emerald-200 p-6 flex flex-col gap-6 shrink-0 md:sticky md:top-0 md:h-screen pt-24 bg-white">
        <div>
          <h2 className="text-xl font-black gradient-text">Admin Panel</h2>
          <p className="text-[10px] uppercase font-bold tracking-wider mt-1 text-muted">GREENSHOP CONTROL</p>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <Link href="/admin" className="sidebar-link">
            📊 İdarə Paneli
          </Link>
          <Link href="/admin/order" className="sidebar-link">
            📦 Sifarişlər
          </Link>
          <Link href="/admin/reliability" className="sidebar-link">
            🛠️ Sistem Dayanıqlığı
          </Link>
          <Link href="/" className="sidebar-link mt-auto hover:text-emerald-400">
            ← Mağazaya qayıt
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-x-hidden pt-24 md:pt-28">
        {children}
      </main>
    </div>
  );
}
