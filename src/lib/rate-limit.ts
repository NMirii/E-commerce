/**
 * Rate Limiting (Sorğu Limiti) Modulu
 * =====================================
 *
 * NƏ EDİR:
 *   Eyni IP-dən çox tez-tez gələn sorğuları bloklayır.
 *   Məsələn: Bir nəfər 1 dəqiqədə 100 dəfə login cəhd edə bilməz.
 *
 * NİYƏ LAZIMDIR:
 *   1. Brute-force hücumlarının qarşısını alır
 *      (robot parol tapmaq üçün minlərcə kombinasiya yoxlayır)
 *   2. DDoS hücumlarını azaldır
 *      (server-i çox sorğu ilə iflic etmək cəhdi)
 *   3. API resurslarını qoruyur
 *      (bir istifadəçi bütün server gücünü istifadə edə bilməz)
 *
 * NECƏ İŞLƏYİR:
 *   - In-memory Map istifadə edir (verilənlər bazası lazım deyil)
 *   - Hər IP üçün son X dəqiqədə neçə sorğu gəldiyini sayır
 *   - Limit aşılsa 429 (Too Many Requests) qaytarır
 *   - 1 dəqiqədən sonra sayğac avtomatik sıfırlanır
 *
 * ⚠️ MƏHDUDIYYƏT:
 *   Serverless (Vercel) mühitdə hər funksiya çağırışı ayrı instansda
 *   olduğu üçün in-memory rate limiting 100% dəqiq deyil.
 *   Production-da daha güclü həll: Vercel Edge Config, Redis, və ya Upstash.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number; // Unix timestamp (milliseconds)
}

// IP-lərin sorğu saylarını saxlayan map
const requestCounts = new Map<string, RateLimitEntry>();

// Hər 5 dəqiqədə köhnə girişləri təmizlə (memory leak-in qarşısını almaq üçün)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of requestCounts) {
    if (now > entry.resetTime) {
      requestCounts.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Pəncərə müddəti (millisaniyə). Default: 60000 (1 dəqiqə) */
  windowMs?: number;
  /** Pəncərə ərzində maksimum sorğu sayı. Default: 60 */
  maxRequests?: number;
}

export interface RateLimitResult {
  /** true = icazə var, false = limit aşılıb */
  allowed: boolean;
  /** Qalan sorğu hüququ */
  remaining: number;
  /** Limitin sıfırlanma vaxtı (Unix ms) */
  resetTime: number;
}

/**
 * IP əsasında rate limiting yoxlaması.
 *
 * @param identifier - Adətən IP adresi (request.headers.get("x-forwarded-for"))
 * @param config - İstəyə bağlı limit parametrləri
 * @returns RateLimitResult — sorğuya icazə var ya yox
 *
 * Nümunə istifadə (API Route):
 *   const ip = request.headers.get("x-forwarded-for") ?? "unknown";
 *   const { allowed, remaining } = checkRateLimit(ip, { maxRequests: 10 });
 *   if (!allowed) {
 *     return NextResponse.json({ error: "Çox tez-tez sorğu" }, { status: 429 });
 *   }
 */
export function checkRateLimit(
  identifier: string,
  config?: RateLimitConfig
): RateLimitResult {
  const windowMs = config?.windowMs ?? 60_000;
  const maxRequests = config?.maxRequests ?? 60;
  const now = Date.now();

  // Vaxtaşırı təmizlik
  cleanup();

  const key = identifier;
  const existing = requestCounts.get(key);

  // Yeni pəncərə başlat (əgər yoxdursa və ya vaxtı keçibsə)
  if (!existing || now > existing.resetTime) {
    requestCounts.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  // Mövcud pəncərə — sayğacı artır
  existing.count++;
  requestCounts.set(key, existing);

  if (existing.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: existing.resetTime,
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetTime: existing.resetTime,
  };
}
