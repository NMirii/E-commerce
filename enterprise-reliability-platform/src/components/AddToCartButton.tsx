"use client";

import { useTransition, useState } from "react";
import { addToCart } from "@/app/actions/cart";

export default function AddToCartButton({
  productId,
  disabled,
  compact,
}: {
  productId: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await addToCart(productId, 1);
      if (res?.success) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      } else {
        alert(res?.error || "Səbətə əlavə edilərkən xəta baş verdi");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={disabled || isPending}
      className={`btn-primary ${compact ? "!py-2 !px-3 !text-xs" : ""}`}
      aria-label="Səbətə at"
    >
      {isPending ? (
        "..."
      ) : added ? (
        "✓"
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      )}
    </button>
  );
}
