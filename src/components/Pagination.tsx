import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  baseQuery: Record<string, string | undefined>;
};

export default function Pagination({
  currentPage,
  totalPages,
  baseQuery,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const hrefFor = (page: number) => {
    const q: Record<string, string> = {};
    for (const [k, v] of Object.entries(baseQuery)) {
      if (v) q[k] = v;
    }
    if (page > 1) q.page = String(page);
    const params = new URLSearchParams(q);
    const s = params.toString();
    return s ? `/?${s}` : "/";
  };

  const pages: (number | "ellipsis")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("ellipsis");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
  }

  return (
    <nav className="pagination" aria-label="Səhifələmə">
      {currentPage > 1 ? (
        <Link href={hrefFor(currentPage - 1)} className="pagination-btn">
          ←
        </Link>
      ) : (
        <span className="pagination-btn disabled">←</span>
      )}

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e-${i}`} className="px-2 text-muted text-sm">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            className={`pagination-btn ${p === currentPage ? "pagination-btn-active" : ""}`}
            aria-current={p === currentPage ? "page" : undefined}
          >
            {p}
          </Link>
        )
      )}

      {currentPage < totalPages ? (
        <Link href={hrefFor(currentPage + 1)} className="pagination-btn">
          →
        </Link>
      ) : (
        <span className="pagination-btn disabled">→</span>
      )}
    </nav>
  );
}
