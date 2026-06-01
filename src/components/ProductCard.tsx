import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "./AddToCartButton";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  inventory_count: number;
}

export default function ProductCard({ product }: { product: Product }) {
  const isOutOfStock = product.inventory_count <= 0;

  return (
    <article className="card flex flex-col h-full">
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-[4/5] bg-slate-100 overflow-hidden group"
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-400">
            Şəkil yoxdur
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/95 text-slate-700 shadow-sm backdrop-blur-sm">
            {product.category}
          </span>
          {isOutOfStock && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-red-500/90 text-white">
              Stokda yoxdur
            </span>
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex-1 min-w-0">
          <Link href={`/products/${product.id}`} className="block group/title">
            <h3 className="font-semibold text-slate-900 line-clamp-2 text-sm sm:text-base group-hover/title:text-emerald-700 transition-colors">
              {product.title}
            </h3>
          </Link>
          {product.description && (
            <p className="text-xs text-muted line-clamp-2 mt-1.5 hidden sm:block">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-end justify-between gap-2 pt-1 border-t border-slate-100">
          <div>
            <p className="text-lg font-bold text-slate-900 tabular-nums">
              {Number(product.price).toFixed(2)}
              <span className="text-xs font-medium text-muted ml-1">AZN</span>
            </p>
          </div>
          <AddToCartButton productId={product.id} disabled={isOutOfStock} compact />
        </div>
      </div>
    </article>
  );
}
