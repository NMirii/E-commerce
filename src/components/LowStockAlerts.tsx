"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface LowStockProduct {
  id: string;
  title: string;
  inventory_count: number;
}

export default function LowStockAlerts() {
  const [alerts, setAlerts] = useState<LowStockProduct[]>([]);

  useEffect(() => {
    const supabase = createClient();

    const fetchLowStock = async () => {
      const res = await fetch("/api/inventory");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    };

    fetchLowStock();

    const channel = supabase
      .channel("inventory-low-stock")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        (
          payload: RealtimePostgresChangesPayload<
            LowStockProduct & { is_active?: boolean }
          >
        ) => {
          const row = payload.new as (LowStockProduct & { is_active?: boolean }) | null;
          if (!row || !("inventory_count" in row)) return;
          if (row.is_active !== false && row.inventory_count <= 5) {
            setAlerts((prev) => {
              const filtered = prev.filter((p) => p.id !== row.id);
              return [...filtered, row].sort(
                (a, b) => a.inventory_count - b.inventory_count
              );
            });
          } else {
            setAlerts((prev) => prev.filter((p) => p.id !== row.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="glass rounded-xl p-4 border border-amber-300 bg-amber-50 anim-fade-up">
      <h4 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-500 anim-pulse" />
        Real-time: Aşağı stok ({alerts.length})
      </h4>
      <ul className="space-y-2 max-h-40 overflow-y-auto">
        {alerts.map((p) => (
          <li
            key={p.id}
            className="flex justify-between text-xs py-1.5 px-2 rounded-lg bg-amber-100/80"
          >
            <span className="text-green-900 truncate pr-2">{p.title}</span>
            <span className="font-mono font-bold text-amber-700 shrink-0">
              {p.inventory_count} ədəd
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
