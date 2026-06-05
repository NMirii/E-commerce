"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { captureError } from "@/lib/monitoring";

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  actionName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Capture the error using our unified monitoring framework
    captureError(error, {
      action: this.props.actionName || "ReactErrorBoundary",
      severity: "high",
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      const fallback = this.props.fallback;

      if (typeof fallback === "function") {
        return fallback(this.state.error, this.handleReset);
      }

      if (fallback) {
        return fallback;
      }

      // Default visual fallback if none is provided (styled with rich dark modes/glassmorphism details)
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-900/60 backdrop-blur-md border border-red-500/20 rounded-2xl max-w-xl mx-auto my-8">
          <div className="text-4xl mb-4">💥</div>
          <h3 className="text-xl font-bold text-red-400 mb-2">Gözlənilməz Xəta Baş Verdi</h3>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed max-w-md">
            Komponent yüklənərkən xəta baş verdi. Sistem idarəçiləri məlumatlandırılıb. Zəhmət olmasa yenidən cəhd edin.
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-semibold shadow-lg shadow-red-600/20 hover:shadow-red-600/30 transition-all cursor-pointer hover:brightness-110 active:scale-95"
          >
            Yenidən Cəhd Et
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
