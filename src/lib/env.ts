/**
 * Mərkəzləşdirilmiş Environment Variables Validasiyası
 * =====================================================
 * Zod ilə bütün env dəyişənlərini tip-təhlükəsiz yoxlayır.
 * Build zamanı çatışmayan və ya yanlış dəyərlər dərhal xəta verir.
 *
 * NİYƏ LAZIMDIR:
 * - Production-da "undefined" açarla işləyib crash olmanın qarşısını alır
 * - Hansı env-lərin NEXT_PUBLIC_ (brauzerə gedən) olduğunu aydın göstərir
 * - Dev/staging/prod mühitləri arasında fərqləri aydınlaşdırır
 */

import { z } from "zod";

// ── Public (brauzerdə görünən) dəyişənlər ──────────────────────
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL düzgün URL olmalıdır"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(10, "NEXT_PUBLIC_SUPABASE_ANON_KEY çox qısadır"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

// ── Server-only (heç vaxt brauzerdə olmamalı) dəyişənlər ──────
const serverSchema = z.object({
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET minimum 32 simvol olmalıdır"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(10, "SUPABASE_SERVICE_ROLE_KEY təyin edilməyib"),
  SENTRY_DSN: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().min(10).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(10).optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// ── Birləşdirilmiş Schema ──────────────────────────────────────
const envSchema = publicSchema.merge(serverSchema);

export type Env = z.infer<typeof envSchema>;

/**
 * Build zamanı tək dəfə çağırılır. Xəta varsa console-a aydın bildirir.
 * Production-da çatışmayan env varsa proses dayanır.
 */
function validateEnv(): Env {
  const raw = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  };

  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    console.error("❌ Environment variables xətaları:");
    console.error(JSON.stringify(errors, null, 2));

    // Production-da xəta varsa proses dayanır
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Production mühitdə env dəyişənləri düzgün konfiqurasiya olunmayıb"
      );
    }
  }

  return parsed.success ? parsed.data : (raw as unknown as Env);
}

export const env = validateEnv();
