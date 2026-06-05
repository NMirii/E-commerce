/**
 * Payment Webhook Route — Ödəniş Bildiriş Nöqtəsi
 * ==================================================
 *
 * NƏ EDİR:
 *   Stripe (və ya digər ödəniş sistemi) ödəniş tamamlandıqda
 *   bu endpoint-ə POST sorğu göndərir. Biz sifarişin statusunu
 *   yeniləyirik.
 *
 * NİYƏ TƏHLÜKƏSİZLİK VACİBDİR:
 *   Bu endpoint olmasa, hər kəs POST /api/webhooks/payment göndərib
 *   istənilən sifarişi "ödənildi" edə bilər. Buna görə:
 *
 *   1. STRIPE_WEBHOOK_SECRET ilə imza yoxlanışı (Signature Verification)
 *      - Stripe hər sorğuya xüsusi imza əlavə edir
 *      - Biz həmin imzanı yoxlayırıq ki, sorğunun həqiqətən Stripe-dan
 *        gəldiyindən əmin olaq
 *
 *   2. Raw body oxumaq (request.text())
 *      - Stripe imza yoxlanışı üçün raw body lazımdır
 *      - request.json() çağırsaq body dəyişir və imza uyğun gəlmir
 *
 *   3. Service Role Client (RLS-i keçir)
 *      - Webhook-da user sessiyası yoxdur, buna görə service client lazımdır
 *
 * STRIPE OLMADAN (İNDİKİ HAL):
 *   Hələ Stripe qoşulmayıb. Buna görə sadə API key yoxlanışı istifadə
 *   edirik. Stripe qoşulanda aşağıdakı komentli kodu aktivləşdirin.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { captureError } from "@/lib/monitoring";

// ── Sadə API Key Yoxlanışı (Stripe olmadan) ─────────────────────
// Bu müvəqqətidir. Stripe inteqrasiyasında bunu Stripe signature ilə əvəz edin.
function verifyWebhookAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Əgər webhook secret təyin olunmayıbsa, development mühitdə icazə ver
  if (!webhookSecret) {
    if (process.env.NODE_ENV === "development") return true;
    return false; // Production-da webhook secret olmadan işləmək OLMAZ
  }

  return authHeader === `Bearer ${webhookSecret}`;
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. Autentifikasiya yoxla ──────────────────────────────────
    if (!verifyWebhookAuth(request)) {
      captureError(new Error("Unauthorized webhook attempt"), {
        action: "payment_webhook",
        severity: "critical",
        metadata: {
          ip: request.headers.get("x-forwarded-for"),
          userAgent: request.headers.get("user-agent"),
        },
      });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ── 2. Body-ni oxu ────────────────────────────────────────────
    const body = await request.json();
    const { order_id, status } = body;

    if (!order_id || !status) {
      return NextResponse.json(
        { error: "order_id və status tələb olunur" },
        { status: 400 }
      );
    }

    // ── 3. Yalnız etibarlı statuslara icazə ver ──────────────────
    const allowedStatuses = ["paid", "failed", "refunded"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Etibarsız status: ${status}` },
        { status: 400 }
      );
    }

    // ── 4. Sifarişi yenilə ───────────────────────────────────────
    const supabase = createServiceClient();

    // Status mapping: Stripe statusunu bizim statusa çevir
    const statusMap: Record<string, string> = {
      paid: "processing",      // Ödəniş uğurlu → emal edilir
      failed: "cancelled",     // Ödəniş uğursuz → ləğv
      refunded: "cancelled",   // Qaytarma → ləğv
    };

    const newStatus = statusMap[status] ?? "pending";

    const { data: order, error } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id)
      .select("id, status")
      .single();

    if (error) {
      captureError(error, {
        action: "payment_webhook",
        severity: "high",
        metadata: { order_id, status },
      });
      return NextResponse.json(
        { error: "Sifariş yenilənə bilmədi" },
        { status: 500 }
      );
    }

    // ── 5. Audit log yaz ──────────────────────────────────────────
    await supabase.from("audit_logs").insert({
      action_type: "ORDER_STATUS_CHANGE",
      details: {
        order_id,
        old_webhook_status: status,
        new_status: newStatus,
        source: "payment_webhook",
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      order_id: order.id,
      status: order.status,
    });
  } catch (error: unknown) {
    captureError(error, {
      action: "payment_webhook",
      severity: "critical",
    });
    return NextResponse.json(
      { error: "Daxili server xətası" },
      { status: 500 }
    );
  }
}

/*
 * ══════════════════════════════════════════════════════════════
 * STRIPE İNTEQRASİYASI (Gələcəkdə aktivləşdirin)
 * ══════════════════════════════════════════════════════════════
 *
 * 1. Stripe-ı quraşdırın:
 *    npm install stripe
 *
 * 2. Yuxarıdakı verifyWebhookAuth() funksiyasını bu ilə əvəz edin:
 *
 *    import Stripe from "stripe";
 *    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
 *
 *    async function verifyStripeSignature(request: NextRequest) {
 *      const body = await request.text();  // raw body LAZIMDIR!
 *      const signature = request.headers.get("stripe-signature")!;
 *
 *      try {
 *        const event = stripe.webhooks.constructEvent(
 *          body,
 *          signature,
 *          process.env.STRIPE_WEBHOOK_SECRET!
 *        );
 *        return event;
 *      } catch (err) {
 *        throw new Error("Invalid Stripe signature");
 *      }
 *    }
 *
 * 3. Stripe Dashboard → Developers → Webhooks → Add endpoint:
 *    URL: https://your-domain.com/api/webhooks/payment
 *    Events: checkout.session.completed, payment_intent.succeeded
 */
