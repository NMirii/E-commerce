import type { NextConfig } from "next";

/**
 * HTTP Təhlükəsizlik Başlıqları
 * ==============================
 * Hər HTTP cavabına əlavə olunur. Brauzerə "bu sayta necə davranmalısan" deyir.
 *
 * NİYƏ LAZIMDIR:
 * - XSS (Cross-Site Scripting) hücumlarının qarşısını alır
 * - Clickjacking (iframe ilə oğurlama) qarşısını alır
 * - HTTPS-ə məcburi yönləndirir
 * - Məlumat sızmasının qarşısını alır
 */
const securityHeaders = [
  {
    // DNS prefetch — sayt sürətini artırır, əlaqədar domainləri əvvəlcədən çözür
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    // HSTS — brauzeri həmişə HTTPS istifadə etməyə məcbur edir (2 il)
    // Bu olmasa hacker HTTP üzərindən trafikinizi oxuya bilər (MITM hücumu)
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // X-Frame-Options — saytınızın başqa saytların iframe-ində açılmasını əngəlləyir
    // Bu olmasa hacker öz saytına sizin saytı gizli iframe ilə qoyub
    // istifadəçinin klikini "oğurlaya" bilər (Clickjacking)
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    // X-Content-Type-Options — brauzerin faylın tipini "özü təxmin etməsini" söndürür
    // Məsələn, .txt faylını HTML kimi interpret edib XSS açığı yaratmasının qarşısını alır
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Referrer-Policy — başqa sayta keçəndə hansı məlumatların göndərilməsini tənzimləyir
    // "origin-when-cross-origin" = eyni sayta tam URL, başqa sayta yalnız domain göndərilir
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    // Permissions-Policy — brauzerin kamera, mikrofon, GPS istifadəsini söndürür
    // E-commerce saytında bunların heç biri lazım deyil
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    // Content-Security-Policy — hansı mənbələrdən skript/şəkil/stil yüklənə biləcəyini deyir
    // Bu, XSS-in ən güclü müdafiəsidir. Hacker injekte etdiyi skript bu siyahıda
    // olmayan domainə sorğu göndərə bilməz.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: *.supabase.co images.unsplash.com picsum.photos placehold.co",
      "font-src 'self' fonts.gstatic.com",
      "connect-src 'self' *.supabase.co *.sentry.io *.ingest.sentry.io",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },

  // Bütün səhifələrə təhlükəsizlik başlıqlarını əlavə et
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Production build optimallaşdırma
  poweredByHeader: false, // "X-Powered-By: Next.js" başlığını gizlədir (fingerprinting)
};

export default nextConfig;
