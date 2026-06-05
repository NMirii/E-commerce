"use client";

import React from "react";
import { RefreshCw, PackageX } from "lucide-react";

interface InventoryErrorFallbackProps {
  error?: Error;
  reset: () => void;
}

export function InventoryErrorFallback({ reset }: InventoryErrorFallbackProps) {
  return (
    <div className="p-6 text-center bg-[#090b11]/80 border border-red-500/20 rounded-xl max-w-lg mx-auto my-6 shadow-lg shadow-red-950/20">
      <div className="w-12 h-12 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-4">
        <PackageX className="w-6 h-6 text-red-400" />
      </div>
      
      <h4 className="text-lg font-semibold text-red-400 mb-2">Anbar Məlumatları Oxunmadı</h4>
      <p className="text-sm text-gray-400 mb-5 leading-relaxed">
        Məhsulun mövcudluğu və anbar qalığı məlumatları sinxronizasiya edilə bilmədi. Satış prosesini tamamlamaq üçün səhifəni yeniləyə bilərsiniz.
      </p>

      <div className="flex justify-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Yenidən Yoxla
        </button>
      </div>
    </div>
  );
}
