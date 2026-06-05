import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { notFound } from "next/navigation";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import Link from "next/link";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: RouteParams) {
  if (!hasSupabaseEnv()) return null;

  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!product) notFound();

  const isOutOfStock = product.inventory_count <= 0;

  return (
    <div className="container-app section-padding">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-emerald-600 mb-8 transition-colors"
      >
        ← Mağazaya qayıt
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 surface-elevated p-6 sm:p-8 anim-fade-up">
        <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
              Şəkil yoxdur
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <span className="chip chip-active w-fit mb-4">{product.category}</span>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {product.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mt-4 mb-6">
            <span className="text-3xl font-bold text-slate-900 tabular-nums">
              {Number(product.price).toFixed(2)}{" "}
              <span className="text-lg font-medium text-muted">AZN</span>
            </span>
            <span className={`badge ${isOutOfStock ? "badge-cancelled" : "badge-green"}`}>
              {isOutOfStock ? "Stokda yoxdur" : `Stok: ${product.inventory_count}`}
            </span>
          </div>

          <div className="prose prose-sm max-w-none flex-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Təsvir
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              {product.description || "Ətraflı təsvir əlavə edilməyib."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-8 mt-8 border-t border-slate-100">
            <AddToCartButton productId={product.id} disabled={isOutOfStock} />
            <Link href="/cart" className="btn-secondary">
              Səbətə get
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
