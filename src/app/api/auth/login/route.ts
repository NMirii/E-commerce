/**
 * Login API Route — Rate Limited & Monitored
 * =============================================
 *
 * ƏLAVƏ EDİLƏN TƏHLÜKƏSİZLİK:
 *   1. Rate Limiting — Eyni IP-dən 1 dəqiqədə max 10 login cəhdi
 *      Niyə: Brute-force hücumlarının qarşısını alır.
 *      Misal: Hacker robot yazıb 1000 parol yoxlamaq istəsə, 10-da bloklayırıq.
 *
 *   2. Monitoring — Uğursuz login cəhdləri log olunur
 *      Niyə: Hücum cəhdlərini Sentry/loglardan görə bilərik.
 *
 *   3. Rate Limit headers — Client-ə qalan hüququnu bildirir
 *      X-RateLimit-Remaining: 7  (daha 7 cəhdiniz var)
 *      X-RateLimit-Reset: 1748...  (nə vaxt sıfırlanır)
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zodIssues } from "@/lib/zod-errors";
import { authenticateUser, toAuthResponse } from "@/lib/auth/users";
import { signAccessToken } from "@/lib/auth/jwt";
import { attachAuthCookie } from "@/lib/auth/cookies";
import { checkRateLimit } from "@/lib/rate-limit";
import { captureError } from "@/lib/monitoring";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  // ── Rate Limit yoxla ────────────────────────────────────────
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed, remaining, resetTime } = checkRateLimit(
    `login:${ip}`,
    { maxRequests: 10, windowMs: 60_000 } // 1 dəqiqədə max 10 cəhd
  );

  if (!allowed) {
    captureError(new Error("Rate limit exceeded on login"), {
      action: "login_rate_limit",
      severity: "medium",
      metadata: { ip },
    });
    return NextResponse.json(
      { error: "Çox tez-tez cəhd etdiniz. 1 dəqiqə gözləyin." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(resetTime),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const session = await authenticateUser(email, password);
    const token = await signAccessToken(session);

    const response = NextResponse.json(toAuthResponse(session));
    attachAuthCookie(response, token);

    // Rate limit başlıqlarını cavaba əlavə et
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    response.headers.set("X-RateLimit-Reset", String(resetTime));

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation Error", details: zodIssues(error) },
        { status: 400 }
      );
    }

    // Uğursuz login cəhdini log et
    captureError(error, {
      action: "login",
      severity: "low",
      metadata: { ip },
    });

    const message =
      error instanceof Error ? error.message : "Server error";
    const status = message.includes("yanlış") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
