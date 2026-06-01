"use client";

import { useTransition, useState } from "react";
import {
  removeFromCart,
  updateCartItemQuantity,
  checkoutCart,
} from "@/app/actions/cart";
import type { CartItemView } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

export default function CartView({
  initialCart,
}: {
  initialCart: CartItemView[];
}) {
  const [cart, setCart] = useState<CartItemView[]>(initialCart);
  const [shippingAddress, setShippingAddress] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    const prevCart = [...cart];
    setCart(cart.map((item) => (item.id === itemId ? { ...item, quantity: newQty } : item)));
    const res = await updateCartItemQuantity(itemId, newQty);
    if (res?.error) {
      alert(res.error);
      setCart(prevCart);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!confirm("Bu məhsulu səbətdən silmək istəyirsiniz?")) return;
    const prevCart = [...cart];
    setCart(cart.filter((item) => item.id !== itemId));
    const res = await removeFromCart(itemId);
    if (res?.error) {
      alert(res.error);
      setCart(prevCart);
    }
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await checkoutCart(shippingAddress);
      if (res && "error" in res && res.error) setError(res.error);
    });
  };

  const total = cart.reduce((sum, item) => {
    const price = item.products?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  if (cart.length === 0) {
    return (
      <div className="surface-card text-center py-16 px-6 max-w-lg mx-auto anim-fade-up">
        <p className="text-lg font-semibold text-slate-900 mb-2">Səbətiniz boşdur</p>
        <p className="text-sm text-muted mb-6">Mağazadan məhsul seçin.</p>
        <Link href="/" className="btn-primary text-sm">
          Alış-verişə başla
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start anim-fade-up">
      <div className="lg:col-span-2 space-y-3">
        {cart.map((item) => {
          const product = item.products;
          if (!product) return null;

          return (
            <div
              key={item.id}
              className="surface-card p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400">
                    —
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${product.id}`}
                  className="font-semibold text-slate-900 hover:text-emerald-700 line-clamp-2"
                >
                  {product.title}
                </Link>
                <p className="text-sm font-bold text-emerald-600 mt-1 tabular-nums">
                  {Number(product.price).toFixed(2)} AZN
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1 || isPending}
                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    disabled={isPending}
                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  disabled={isPending}
                  className="btn-ghost text-red-600 hover:bg-red-50 p-2"
                  title="Sil"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="surface-elevated p-6 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Sifariş xülasəsi</h2>

        <div className="space-y-3 text-sm mb-6">
          <div className="flex justify-between text-muted">
            <span>Məhsul</span>
            <span className="font-medium text-slate-900">
              {cart.reduce((s, i) => s + i.quantity, 0)} ədəd
            </span>
          </div>
          <div className="flex justify-between pt-3 border-t border-slate-100">
            <span className="font-medium text-slate-900">Cəmi</span>
            <span className="text-xl font-bold text-emerald-600 tabular-nums">
              {total.toFixed(2)} AZN
            </span>
          </div>
        </div>

        {error && <div className="mb-4 alert-error text-xs">{error}</div>}

        <form onSubmit={handleCheckout} className="space-y-4">
          <div>
            <label className="block label-text mb-2">Çatdırılma ünvanı</label>
            <textarea
              required
              rows={3}
              disabled={isPending}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Ünvanınızı yazın..."
              className="input-field min-h-[80px] resize-y"
            />
          </div>
          <button type="submit" disabled={isPending} className="w-full btn-primary py-3">
            {isPending ? "Göndərilir..." : "Sifarişi tamamla"}
          </button>
          <Link href="/checkout" className="w-full btn-secondary py-3 text-center block text-sm">
            Ödəniş səhifəsi
          </Link>
        </form>
      </div>
    </div>
  );
}
