import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="container-app py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-bold">
                G
              </span>
              <span className="text-lg font-bold text-slate-900">GreenShop</span>
            </div>
            <p className="text-sm text-muted leading-relaxed max-w-xs">
              Təbii və keyfiyyətli məhsullar. Müasir, sürətli və təhlükəsiz alış-veriş.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4">
              Mağaza
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/" className="text-sm text-muted hover:text-emerald-600 transition-colors">
                  Bütün məhsullar
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-sm text-muted hover:text-emerald-600 transition-colors">
                  Səbət
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4">
              Hesab
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Hesabım", href: "/account" },
                { label: "Sifarişlər", href: "/orders" },
                { label: "Daxil ol", href: "/login" },
                { label: "Qeydiyyat", href: "/register" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-muted hover:text-emerald-600 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4">
              Dəstək
            </h4>
            <ul className="space-y-2.5 text-sm text-muted">
              <li>Çatdırılma: 1–3 iş günü</li>
              <li>Ödəniş: təhlükəsiz checkout</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
          <span>© {new Date().getFullYear()} GreenShop. Bütün hüquqlar qorunur.</span>
        </div>
      </div>
    </footer>
  );
}
