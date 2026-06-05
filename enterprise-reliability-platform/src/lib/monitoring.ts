/**
 * Monitoring & Xəta İzləmə Modulu
 * ==================================
 * Server Actions və API route-larda baş verən xətaları
 * strukturlaşdırılmış şəkildə qeyd edir.
 */

import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";

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
 * Xətanı strukturlaşdırılmış şəkildə log edir və Sentry-ə göndərir.
 */
export function captureError(error: unknown, context: ErrorContext): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const severity = context.severity || "high";
  const message = `[${context.action}] ${errorMessage}`;

  // Log to our custom structured logger (with PII/PCI scrubbing)
  const logDetails = {
    action: context.action,
    userId: context.userId,
    severity,
    metadata: context.metadata,
    stack: error instanceof Error ? error.stack : undefined,
  };

  if (severity === "critical") {
    logger.fatal(message, logDetails);
  } else if (severity === "high") {
    logger.error(message, logDetails);
  } else if (severity === "medium") {
    logger.warn(message, logDetails);
  } else {
    logger.info(message, logDetails);
  }

  // Log to Sentry
  try {
    Sentry.captureException(error, {
      tags: {
        action: context.action,
        severity: severity,
      },
      user: context.userId ? { id: context.userId } : undefined,
      extra: context.metadata,
    });
  } catch (sentryErr) {
    logger.warn("Sentry captureException failed:", sentryErr);
  }
}

/**
 * Server Action wrapper — xətaları avtomatik tutur.
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

  // Structured log for web vitals
  logger.info(`Web Vital Metric: ${metric.name} = ${Math.round(metric.value)}`, logEntry);
}

