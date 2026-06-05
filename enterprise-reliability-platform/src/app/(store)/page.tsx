import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import Link from "next/link";

const PAGE_SIZE = 24;

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createClient();
  const params = await searchParams;
  const search = params.search?.trim() || "";
  const category = params.category || "";
  const sort = params.sort || "";
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  if (search) query = query.ilike("title", `%${search}%`);
  if (category) query = query.eq("category", category);

  if (sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: products, count } = await query.range(from, to);
  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const { data: categoriesData } = await supabase
    .from("products")
    .select("category")
    .eq("is_active", true);

  const categories = Array.from(
    new Set((categoriesData || []).map((p) => p.category).filter(Boolean))
  ).sort();

  const baseQuery = {
    search: search || undefined,
    category: category || undefined,
    sort: sort || undefined,
  };

  const chipQuery = (overrides: Record<string, string | undefined>) => {
    const q: Record<string, string> = {};
    const merged = { ...baseQuery, ...overrides, page: undefined };
    for (const [k, v] of Object.entries(merged)) {
      if (v) q[k] = v;
    }
    const s = new URLSearchParams(q).toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <>
      <section className="hero-section">
        <div className="container-app py-10 md:py-14">
          <div className="max-w-2xl anim-fade-up">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">
              Ekoloji mağaza
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
              Təbii məhsullar,{" "}
              <span className="gradient-text">bir kliklə</span>
            </h1>
            <p className="mt-4 text-base text-muted max-w-lg">
              Keyfiyyətli məhsullar, sürətli çatdırılma və sadə alış-veriş təcrübəsi.
            </p>
          </div>
        </div>
      </section>

      <div className="container-app section-padding">
        {/* Toolbar */}
        <div className="surface-card p-4 sm:p-5 mb-6 space-y-4 anim-fade-up">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <form method="GET" action="/" className="flex gap-2 flex-1 max-w-md">
              <input
                type="text"
                name="search"
                placeholder="Məhsul axtar..."
                defaultValue={search}
                className="input-field flex-1"
              />
              {category && <input type="hidden" name="category" value={category} />}
              {sort && <input type="hidden" name="sort" value={sort} />}
              <button type="submit" className="btn-primary shrink-0 px-4">
                Axtar
              </button>
            </form>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted mr-1">Sırala:</span>
              {[
                { key: "", label: "Yeni" },
                { key: "price_asc", label: "Ucuz" },
                { key: "price_desc", label: "Bahalı" },
              ].map((opt) => (
                <Link
                  key={opt.key || "default"}
                  href={chipQuery({ sort: opt.key || undefined })}
                  className={`chip ${sort === opt.key || (!sort && !opt.key) ? "chip-active" : ""}`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>

          {categories.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted mb-2">Kateqoriya</p>
              <div className="chip-scroll">
                <Link
                  href={chipQuery({ category: undefined })}
                  className={`chip ${!category ? "chip-active" : ""}`}
                >
                  Hamısı
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat}
                    href={chipQuery({ category: cat })}
                    className={`chip ${category === cat ? "chip-active" : ""}`}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5 text-sm text-muted">
          <span>
            {totalCount > 0 ? (
              <>
                <strong className="text-slate-900">{totalCount}</strong> məhsul
                {search && (
                  <>
                    {" "}
                    — &quot;{search}&quot; üçün
                  </>
                )}
              </>
            ) : (
              "Məhsul tapılmadı"
            )}
          </span>
          {totalPages > 1 && (
            <span>
              Səhifə {currentPage} / {totalPages}
            </span>
          )}
        </div>

        {!products || products.length === 0 ? (
          <div className="surface-card text-center py-16 px-6 anim-fade-up">
            <p className="text-lg font-semibold text-slate-900 mb-2">Məhsul tapılmadı</p>
            <p className="text-sm text-muted mb-6">
              Filtrləri dəyişin və ya axtarışı sıfırlayın.
            </p>
            <Link href="/" className="btn-secondary text-sm">
              Hamısını göstər
            </Link>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination
              currentPage={Math.min(currentPage, totalPages)}
              totalPages={totalPages}
              baseQuery={baseQuery}
            />
          </>
        )}
      </div>
    </>
  );
}
