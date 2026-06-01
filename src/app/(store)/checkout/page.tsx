"use client";

import { useActionState } from "react";
import { placeOrderAction } from "@/app/actions/orders";
import Link from "next/link";

export default function CheckoutPage() {
  const [state, formAction, isPending] = useActionState(placeOrderAction, undefined);

  return (
    <div className="container-app section-padding flex justify-center">
      <div className="w-full max-w-lg surface-elevated p-8 anim-fade-up">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Ödəniş</h1>
        <p className="text-sm text-muted mb-8">Çatdırılma ünvanını təsdiqləyin.</p>

        {state?.error && <div className="mb-6 alert-error">{state.error}</div>}

        <form action={formAction} className="space-y-5">
          <div>
            <label className="block label-text mb-2">Çatdırılma ünvanı</label>
            <textarea
              name="shipping_address"
              required
              minLength={5}
              rows={3}
              disabled={isPending}
              className="input-field min-h-[100px] resize-y"
              placeholder="Ünvanınız..."
            />
          </div>
          <button type="submit" className="w-full btn-primary py-3" disabled={isPending}>
            {isPending ? "Göndərilir..." : "Sifarişi təsdiqlə"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-muted">
          <Link href="/cart" className="text-emerald-600 hover:underline font-medium">
            ← Səbət
          </Link>
        </p>
      </div>
    </div>
  );
}
