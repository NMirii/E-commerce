"use client";

import { useCallback } from "react";
import useSWRInfinite from "swr/infinite";

interface AuditLog {
  id: string;
  action_type: string;
  details: Record<string, unknown> | null;
  created_at: string;
  user_id?: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AuditLogFeed() {
  const getKey = (pageIndex: number, previous: { hasMore?: boolean } | null) => {
    if (previous && !previous.hasMore) return null;
    return `/api/audit-logs?page=${pageIndex + 1}&limit=12`;
  };

  const { data, size, setSize, isLoading, isValidating } = useSWRInfinite(
    getKey,
    fetcher,
    { revalidateOnFocus: true }
  );

  const logs: AuditLog[] = data?.flatMap((p) => p.logs ?? []) ?? [];
  const hasMore = data?.[data.length - 1]?.hasMore ?? false;
  const loadMore = useCallback(() => {
    if (hasMore && !isValidating) setSize(size + 1);
  }, [hasMore, isValidating, setSize, size]);

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-5 border-b border-emerald-200 flex justify-between items-center">
        <h3 className="font-bold text-lg page-title">Fəaliyyət Tarixçəsi</h3>
        <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
          Audit Logs
        </span>
      </div>

      <div className="max-h-96 overflow-y-auto p-4 space-y-3">
        {isLoading && logs.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-14 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center py-8 text-muted text-sm">Hələ qeyd yoxdur.</p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 anim-fade-up"
            >
              <div className="flex justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-emerald-700">
                  {log.action_type}
                </span>
                <span className="text-[10px] text-muted">
                  {new Date(log.created_at).toLocaleString("az-AZ")}
                </span>
              </div>
              <p className="text-xs text-muted font-mono">
                {log.user_id ? `İstifadəçi: ${log.user_id.slice(0, 8)}…` : "Sistem"}
              </p>
              {log.details && (
                <pre className="text-[10px] mt-1 text-muted overflow-x-auto">
                  {JSON.stringify(log.details).slice(0, 120)}
                  {JSON.stringify(log.details).length > 120 ? "…" : ""}
                </pre>
              )}
            </div>
          ))
        )}
      </div>

      {hasMore && (
        <div className="p-4 border-t border-emerald-200 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isValidating}
            className="btn-secondary py-2 text-xs w-full"
          >
            {isValidating ? "Yüklənir..." : "Daha çox yüklə"}
          </button>
        </div>
      )}
    </div>
  );
}
