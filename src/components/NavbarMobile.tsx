"use client";

import Link from "next/link";
import { useState } from "react";

type NavItem = { href: string; label: string };

export default function NavbarMobile({
  items,
  isAdmin,
}: {
  items: NavItem[];
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn-icon"
        aria-label="Menyu"
        aria-expanded={open}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 top-[var(--header-height)] bg-slate-900/20 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 right-0 top-full z-50 border-b border-slate-200 bg-white shadow-lg">
            <div className="container-app py-3 flex flex-col gap-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-semibold text-emerald-700 bg-emerald-50"
                >
                  Admin panel
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
