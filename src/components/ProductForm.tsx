"use client";

import { useActionState, useEffect } from "react";
import { saveProductAction } from "@/app/actions/products";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  inventory_count: number;
}

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
}

export default function ProductForm({ product, onSuccess }: ProductFormProps) {
  const [state, formAction, isPending] = useActionState(saveProductAction, undefined);

  useEffect(() => {
    if (state?.success && onSuccess) {
      onSuccess();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      {product?.id && <input type="hidden" name="id" value={product.id} />}

      {state?.error && (
        <div className="alert-error text-xs">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="alert-success text-xs">
          Məhsul uğurla yadda saxlanıldı!
        </div>
      )}

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 label-text">
          Başlıq
        </label>
        <input
          type="text"
          name="title"
          defaultValue={product?.title || ""}
          required
          disabled={isPending}
          className="input-field"
          placeholder="Məhsulun adı"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 label-text">
          Kateqoriya
        </label>
        <input
          type="text"
          name="category"
          defaultValue={product?.category || ""}
          required
          disabled={isPending}
          className="input-field"
          placeholder="Məs. Elektronika, Geyim"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 label-text">
            Qiymət (AZN)
          </label>
          <input
            type="number"
            step="0.01"
            name="price"
            defaultValue={product?.price || ""}
            required
            disabled={isPending}
            className="input-field"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 label-text">
            Stok Sayı
          </label>
          <input
            type="number"
            name="inventory_count"
            defaultValue={product?.inventory_count ?? ""}
            required
            disabled={isPending}
            className="input-field"
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 label-text">
          Şəkil URL (İsteğe bağlı)
        </label>
        <input
          type="text"
          name="image_url"
          defaultValue={product?.image_url || ""}
          disabled={isPending}
          className="input-field"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 label-text">
          Təsvir
        </label>
        <textarea
          name="description"
          defaultValue={product?.description || ""}
          disabled={isPending}
          className="input-field min-h-[80px]"
          placeholder="Məhsul haqqında qısa məlumat..."
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full btn-primary py-2.5 mt-2"
      >
        {isPending ? "Yadda saxlanılır..." : product ? "Məhsulu yenilə" : "Məhsul yarat"}
      </button>
    </form>
  );
}
