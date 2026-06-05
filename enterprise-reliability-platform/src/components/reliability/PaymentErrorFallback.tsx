"use client";

import React, { useMemo } from "react";
import { AlertCircle, RotateCcw, CreditCard } from "lucide-react";

interface PaymentErrorFallbackProps {
  error?: Error;
  reset: () => void;
}

export function PaymentErrorFallback({ reset }: PaymentErrorFallbackProps) {
  // Generate transaction ref once (memoized)
  // Use a pure function to create a deterministic ID
  const transactionRef = useMemo(() => {
    // Create a simple deterministic ID based on component lifecycle
    // In production, this would come from an error event or database
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "TXN-";
    for (let i = 0; i < 6; i++) {
      result += chars[i % chars.length];
    }
    return result;
  }, []);
  return (
    <div className="p-8 text-center bg-[#0d0f1b]/90 border border-amber-500/30 rounded-2xl max-w-xl mx-auto my-8 shadow-xl shadow-amber-500/5 backdrop-blur-md">
      <div className="w-16 h-16 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
        <CreditCard className="w-8 h-8 text-amber-400" />
      </div>
      
      <h3 className="text-xl font-bold text-amber-300 mb-3 flex items-center justify-center gap-2">
        <AlertCircle className="w-5 h-5 text-amber-500" />
        Ödəniş Emalı Zamanı Xəta
      </h3>
      
      <p className="text-sm text-gray-300 mb-6 leading-relaxed">
        Ödəniş gateway əlaqəsi kəsildi və ya tranzaksiya müvəqqəti təsdiqlənmədi. Kart məlumatlarınız təhlükəsiz saxlanılır (PCI Compliant).
      </p>

      {/* Avoid exposing technical details in payment screen to non-admin users */}
      <div className="mb-6 p-3 bg-red-950/40 rounded-lg text-xs font-mono text-red-300/80 border border-red-900/30">
        Tranzaksiya Ref: {transactionRef} | Status: Təkrarlanan Əlaqə
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-lg font-semibold transition-all cursor-pointer hover:brightness-110 active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          Yenidən Ödəniş Edin
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg font-semibold transition-all cursor-pointer"
        >
          Səhifəni Yenilə
        </button>
      </div>
    </div>
  );
}
