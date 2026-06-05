"use client";

import { useActionState } from "react";
import { signUp } from "@/app/actions/auth";
import Link from "next/link";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(signUp, undefined);

  return (
    <div className="container-app section-padding flex items-center justify-center min-h-[calc(100vh-var(--header-height)-8rem)]">
      <div className="w-full max-w-md surface-elevated p-8 sm:p-10 anim-fade-up">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Qeydiyyat</h1>
          <p className="text-sm mt-2 text-muted">Yeni GreenShop hesabı yaradın</p>
        </div>

        {state?.error && <div className="mb-6 alert-error">{state.error}</div>}

        <form action={formAction} className="space-y-5">
          <div>
            <label className="block label-text mb-2">Ad Soyad</label>
            <input
              type="text"
              name="full_name"
              placeholder="Adınız"
              required
              className="input-field"
              disabled={isPending}
            />
          </div>
          <div>
            <label className="block label-text mb-2">E-poçt</label>
            <input
              type="email"
              name="email"
              placeholder="email@example.com"
              required
              className="input-field"
              disabled={isPending}
            />
          </div>
          <div>
            <label className="block label-text mb-2">Şifrə</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              className="input-field"
              disabled={isPending}
            />
          </div>
          <button type="submit" className="w-full btn-primary py-3" disabled={isPending}>
            {isPending ? "Qeydiyyat..." : "Hesab yarat"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-muted">
          Hesabınız var?{" "}
          <Link href="/login" className="text-emerald-600 hover:underline font-semibold">
            Daxil ol
          </Link>
        </p>
      </div>
    </div>
  );
}
