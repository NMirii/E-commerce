"use client";

import { useState } from "react";
import useSWR from "swr";
import ProductForm from "@/components/ProductForm";
import AuditLogFeed from "@/components/AuditLogFeed";
import LowStockAlerts from "@/components/LowStockAlerts";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  inventory_count: number;
}

interface Order {
  id: string;
  total: number;
  status: string;
}

const fetcher = async (url: string) => {
  const json = await fetch(url).then((r) => r.json());
  return Array.isArray(json) ? json : (json.products as Product[]);
};

export default function AdminDashboardView({
  initialProducts,
  initialOrders,
}: {
  initialProducts: Product[];
  initialOrders: Order[];
}) {
  const { data: products, mutate } = useSWR<Product[]>(
    "/api/products?all=true&limit=100",
    fetcher,
    {
    fallbackData: initialProducts,
      revalidateOnFocus: true,
    }
  );

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Stock adjustment function (Optimistic UI)
  const adjustStock = async (productId: string, newStock: number) => {
    if (newStock < 0 || !products) return;

    // 1. Optimistic Update
    const prevProducts = [...products];
    const updatedProducts = products.map((p) =>
      p.id === productId ? { ...p, inventory_count: newStock } : p
    );
    mutate(updatedProducts, false);

    try {
      // 2. API Request
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventory_count: newStock }),
      });

      if (!res.ok) {
        throw new Error("Failed to update stock");
      }
      
      // 3. Revalidate
      mutate();
    } catch {
      alert("Stok yenilənərkən xəta baş verdi, geri qaytarılır...");
      mutate(prevProducts);
    }
  };

  // Delete product (Soft delete/Deactivate)
  const deleteProduct = async (productId: string) => {
    if (!confirm("Bu məhsulu silmək istədiyinizdən əminsiniz?")) return;

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      alert("Məhsul silindi");
      mutate();
    } catch {
      alert("Məhsul silinərkən xəta baş verdi");
    }
  };

  // Filter products locally
  const filteredProducts = (products || []).filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category ? p.category === category : true;
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set((products || []).map((p) => p.category)));

  // Analytics
  const totalSales = initialOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total), 0);
  const orderCount = initialOrders.length;
  const lowStockCount = (products || []).filter((p) => p.inventory_count <= 5).length;

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="kpi-card">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Cəmi Satış</span>
          <h2 className="text-3xl font-black text-emerald-600 mt-2">{totalSales.toFixed(2)} AZN</h2>
        </div>
        <div className="kpi-card">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Sifariş Sayı</span>
          <h2 className="text-3xl font-black text-emerald-600 mt-2">{orderCount} ədəd</h2>
        </div>
        <div className="kpi-card" style={{ borderColor: lowStockCount > 0 ? "rgba(239,68,68,0.25)" : "" }}>
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: lowStockCount > 0 ? "#f87171" : "rgba(16,185,129,0.4)" }}
          >
            Kritik Stok Uyarısı
          </span>
          <h2 className={`text-3xl font-black mt-2 ${lowStockCount > 0 ? "text-red-400" : "text-emerald-600"}`}>
            {lowStockCount} məhsul
          </h2>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Ada görə axtar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field max-w-xs py-2"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field py-2"
            style={{ width: "180px" }}
          >
            <option value="">Bütün kateqoriyalar</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setShowAddForm(!showAddForm);
          }}
          className="btn-primary py-2 text-xs shrink-0 w-full sm:w-auto text-center"
        >
          {showAddForm ? "İmtina et" : "➕ Yeni Məhsul"}
        </button>
      </div>

      {/* Forms Drawer */}
      {showAddForm && (
        <div className="p-6 rounded-xl glass max-w-lg anim-fade-up">
          <h3 className="text-lg font-bold page-title mb-4">Yeni Məhsul Əlavə Et</h3>
          <ProductForm
            onSuccess={() => {
              setShowAddForm(false);
              mutate();
            }}
          />
        </div>
      )}

      {editingProduct && (
        <div className="p-6 rounded-xl glass max-w-lg anim-fade-up">
          <h3 className="text-lg font-bold page-title mb-4">Məhsulu Redaktə Et</h3>
          <ProductForm
            product={editingProduct}
            onSuccess={() => {
              setEditingProduct(null);
              mutate();
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LowStockAlerts />
        <AuditLogFeed />
      </div>

      {/* Products list */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-5 border-b border-emerald-200">
          <h3 className="font-bold text-lg page-title">Məhsul Kataloqu</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ad</th>
                <th>Kateqoriya</th>
                <th>Qiymət</th>
                <th>Stok</th>
                <th>Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td className="font-bold">{p.title}</td>
                  <td>{p.category}</td>
                  <td className="text-emerald-600 font-mono">{p.price} AZN</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustStock(p.id, p.inventory_count - 1)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-mono font-bold page-title">{p.inventory_count}</span>
                      <button
                        onClick={() => adjustStock(p.id, p.inventory_count + 1)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setShowAddForm(false);
                          setEditingProduct(p);
                        }}
                        className="text-emerald-400 hover:underline text-xs font-semibold"
                      >
                        Düzəliş
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="text-red-400 hover:underline text-xs font-semibold"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
