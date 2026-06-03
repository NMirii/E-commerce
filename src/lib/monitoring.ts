/**
 * Monitoring & Xəta İzləmə Modulu
 * ==================================
 * Server Actions və API route-larda baş verən xətaları
 * strukturlaşdırılmış şəkildə qeyd edir.
 *
 * NİYƏ LAZIMDIR:
 * - Production-da istifadəçi "xəta baş verdi" deyəndə
 *   biz dəqiq nə olduğunu bilməliyik
 * - console.error istifadə etsək loglar itə bilər
 * - Bu modul gələcəkdə Sentry-ə qoşulmağa hazırdır
 * - Structured logging — hər xəta JSON formatında log olunur,
 *   bu da axtarışı asanlaşdırır
 *
 * SENTRY QOŞULMASI (gələcəkdə):
 *   1. npm install @sentry/nextjs
 *   2. npx @sentry/wizard@latest -i nextjs
 *   3. captureException çağırışlarını aktivləşdirin
 */

type ErrorSeverity = "low" | "medium" | "high" | "critical";

interface ErrorContext {
  /** Xətanın baş verdiyi yer (server action adı, API route və s.) */
  action: string;
  /** İstifadəçi ID (əgər login olubsa) */
  userId?: string;
  /** Əlavə metadata */
  metadata?: Record<string, unknown>;
  /** Xətanın ciddiliyi */
  severity?: ErrorSeverity;
}

/**
 * Xətanı strukturlaşdırılmış şəkildə log edir.
 * Sentry quraşdırıldıqda avtomatik Sentry-ə göndərəcək.
 */
export function captureError(error: unknown, context: ErrorContext): void {
  const errorMessage =
    error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const logEntry = {
    timestamp: new Date().toISOString(),
    level: "error",
    message: errorMessage,
    ...context,
    stack: errorStack,
  };

  // Structured JSON log — cloud hosting-lər (Vercel, AWS) bu formatı anlayır
  console.error(JSON.stringify(logEntry));

  // ── Sentry inteqrasiyası (aktivləşdirmək üçün npm install @sentry/nextjs) ──
  // import * as Sentry from "@sentry/nextjs";
  // Sentry.captureException(error, {
  //   tags: { action: context.action, severity: context.severity },
  //   user: context.userId ? { id: context.userId } : undefined,
  //   extra: context.metadata,
  // });
}

/**
 * Server Action wrapper — xətaları avtomatik tutur.
 * Hər server action-ı bu funksiya ilə sarıya bilərsiniz.
 *
 * Nümunə:
 *   const safeAction = withErrorTracking("placeOrder", async () => { ... });
 */
export function withErrorTracking<T>(
  actionName: string,
  fn: () => Promise<T>,
  userId?: string
): Promise<T> {
  return fn().catch((error) => {
    captureError(error, {
      action: actionName,
      userId,
      severity: "high",
    });
    throw error;
  });
}

/**
 * Web Vitals metriklərini log edir.
 * Next.js-in reportWebVitals ilə birlikdə istifadə olunur.
 *
 * NİYƏ LAZIMDIR:
 * - LCP (Largest Contentful Paint) — Sayt nə qədər tez yüklənir?
 * - FID (First Input Delay) — İstifadəçi ilk klikdən nə qədər sonra cavab alır?
 * - CLS (Cumulative Layout Shift) — Səhifə yüklənəndə elementlər atılır/sürüşürmü?
 * - Google bu metrikləri SEO sıralamasında istifadə edir
 */
export function reportMetric(metric: {
  name: string;
  value: number;
  id: string;
}): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: "info",
    type: "web_vital",
    metric: metric.name,
    value: Math.round(metric.value),
    id: metric.id,
  };

  // Vercel Analytics varsa ora göndər, yoxsa console-a yaz
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    console.log(JSON.stringify(logEntry));
  }
}
