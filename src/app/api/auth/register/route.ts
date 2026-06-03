/**
 * Register API Route — Rate Limited & Monitored
 * ================================================
 *
 * ƏLAVƏ EDİLƏN TƏHLÜKƏSİZLİK:
 *   1. Rate Limiting — Eyni IP-dən 1 dəqiqədə max 5 qeydiyyat
 *      Niyə: Spam hesab yaradılmasının qarşısını alır.
 *      Misal: Bot minlərlə saxta hesab yaratmaq istəsə, 5-də bloklayırıq.
 *
 *   2. Monitoring — Uğursuz qeydiyyat cəhdləri log olunur
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zodIssues } from "@/lib/zod-errors";
import { registerUser, toAuthResponse } from "@/lib/auth/users";
import { signAccessToken } from "@/lib/auth/jwt";
import { attachAuthCookie } from "@/lib/auth/cookies";
import { checkRateLimit } from "@/lib/rate-limit";
import { captureError } from "@/lib/monitoring";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2).optional(),
});

export async function POST(request: NextRequest) {
  // ── Rate Limit yoxla (qeydiyyat üçün daha az limit) ─────────
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed, remaining, resetTime } = checkRateLimit(
    `register:${ip}`,
    { maxRequests: 5, windowMs: 60_000 } // 1 dəqiqədə max 5 qeydiyyat cəhdi
  );

  if (!allowed) {
    captureError(new Error("Rate limit exceeded on register"), {
      action: "register_rate_limit",
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
    const { email, password, full_name } = registerSchema.parse(body);

    const session = await registerUser({ email, password, full_name });
    const token = await signAccessToken(session);

    const response = NextResponse.json(
      { ...toAuthResponse(session), message: "Qeydiyyat uğurludur" },
      { status: 201 }
    );
    attachAuthCookie(response, token);

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

    captureError(error, {
      action: "register",
      severity: "low",
      metadata: { ip },
    });

    const message =
      error instanceof Error ? error.message : "Server error";
    const status = message.includes("artıq") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
