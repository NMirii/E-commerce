# Enterprise E-Commerce Deployment — Engineering Insights

## Seçilmiş platforma

**E-commerce (GreenShop)** — Next.js 16, React 19, Supabase, JWT auth, admin panel, sifariş/inventar API-ləri.

E-commerce üçün kritik tələblər: ödəniş təhlükəsizliyi, müştəri məlumatlarının qorunması, inventar sinxronizasiyası, audit logları və production-da xəta izləmə.

---

## Addım 1: Production-ready konfiqurasiya

### Dev vs Production fərqləri

| Aspekt | Development | Production |
|--------|-------------|------------|
| Env | `.env.local` | Vercel / GitHub Secrets |
| Supabase | Test layihəsi | Ayrı prod layihəsi və ya eyni (staging/prod branch) |
| JWT | Qısa secret ola bilər | Minimum 32 simvol, təsadüfi |
| Xəta mesajları | Detallı | İstifadəçiyə generic, serverdə structured log |
| Build | `next dev` | `next build` + edge CDN |

### Env idarəetməsi

- `src/lib/env.ts` — Zod ilə build/runtime validasiya
- `.env.example` — komanda üçün nümunə (secret-lər commit olunmur)
- Public (`NEXT_PUBLIC_*`) vs server-only (`JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) ayrımı

### Təhlükəsizlik

- `next.config.ts` — HSTS, CSP, X-Frame-Options, Permissions-Policy
- JWT session cookie, role-based admin qorunması (`src/proxy.ts`)
- Rate limiting (`src/lib/rate-limit.ts`)
- Audit log API (`/api/audit-logs`)

---

## Addım 2: CI/CD pipeline

### Workflow-lar

1. **`.github/workflows/ci.yml`** — hər push/PR-də:
   - `npm ci`
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run build` (CI placeholder env ilə)

2. **`.github/workflows/deploy.yml`** — `main` / `staging` push:
   - Vercel CLI ilə preview (staging) və production (main) deploy
   - Secret-lər yoxdursa workflow skip olunur (CI uğursuz olmur)

### GitHub-da uğursuzluğun əsas səbəbi (düzəldildi)

**ESLint xətası** — `AuthContext.tsx`-də `useEffect` içində `refresh()` çağırışı React 19 `react-hooks/set-state-in-effect` qaydasını pozurdu. Həll: sessiya fetch-i ayrı `fetchAuthSession()` funksiyasına çıxarıldı, effect yalnız mount zamanı promise callback ilə state yeniləyir.

### Rollback strategiyası

- Vercel Dashboard → Deployments → əvvəlki deploy-u "Promote to Production"
- Git revert + push `main`-ə

---

## Addım 3: Monitoring

- `src/lib/monitoring.ts` — structured JSON error logging, Web Vitals hook
- Gələcək: Sentry (`NEXT_PUBLIC_SENTRY_DSN`) — kod hazırdır, comment-də
- E-commerce metrikləri: conversion, ödəniş uğursuzluğu, aşağı stok (`LowStockAlerts`)

---

## Addım 4: Multi-environment

| Mühit | Branch | Deploy |
|-------|--------|--------|
| Development | local | `npm run dev` |
| Staging | `staging` | Vercel Preview |
| Production | `main` | Vercel Production |

Preview deployment: feature branch PR → Vercel Git inteqrasiyası (opsional) və ya staging branch push.

---

## Addım 5: Compliance (E-commerce)

- **PCI**: Kart məlumatları serverdə saxlanmır; Stripe webhook stub (`/api/webhooks/payment`)
- **Müştəri məlumatı**: Supabase RLS + JWT auth
- **Audit**: Admin əməliyyatları `/api/audit-logs`
- **Dependency scanning**: `npm audit` CI-da manual/addım kimi əlavə oluna bilər

---

## Öyrənilənlər

1. CI build üçün real Supabase secret lazım deyil — placeholder env kifayətdir.
2. React 19 + eslint-config-next yeni hook qaydaları tətbiq edir; auth bootstrap pattern-i yeniləmək lazım idi.
3. Deploy və CI ayrı workflow olmalıdır; deploy secret-ləri olmadan skip edilməlidir.
4. `.env.example` `.gitignore`-da `!.env.example` istisnası ilə commit olunmalıdır.

---

## Növbəti addımlar (tövsiyə)

1. GitHub-da düzəlişləri push edin → CI yaşıl olmalıdır
2. Vercel layihəsi yaradın, GitHub repo qoşun
3. GitHub Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
4. Vercel Environment Variables: real Supabase + JWT dəyərləri
5. Custom domain + HTTPS Vercel-də avtomatikdir
