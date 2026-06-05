# enterprise-deployment-platform

GreenShop — Next.js 16 enterprise e-commerce platforması (Supabase, JWT auth, admin panel, CI/CD, production security headers).

## Platform seçimi

**E-commerce** — inventar idarəetməsi, səbət/checkout, ödəniş webhook stub, audit log, rate limiting və production deployment (Vercel + GitHub Actions).

## Texnologiyalar

- **Frontend/Backend:** Next.js 16, React 19, TypeScript
- **Database/Auth:** Supabase (PostgreSQL + RLS)
- **CI/CD:** GitHub Actions (lint, typecheck, build, Vercel deploy)
- **Hosting:** Vercel (edge, preview + production)
- **Monitoring:** Structured logging + Web Vitals (`src/lib/monitoring.ts`)

## Quraşdırma

### Tələblər

- Node.js 20+
- Supabase hesabı

### Lokal inkişaf

```bash
npm install
cp .env.example .env.local
# .env.local dəyərlərini doldurun
npm run dev
```

Supabase SQL: `supabase/schema.sql` (ətraflı: `supabase/SETUP-AZ.md`).

### Skriptlər

| Əmr | Təsvir |
|-----|--------|
| `npm run dev` | İnkişaf serveri |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |

## Arxitektura

```
src/app/(store)/     — Mağaza (kataloq, səbət, checkout)
src/app/admin/       — Admin panel
src/app/api/         — REST API
src/app/actions/     — Server Actions
src/proxy.ts         — Route qorunması (admin, checkout, account)
src/lib/env.ts       — Env validasiya (Zod)
src/lib/monitoring.ts — Error + Web Vitals logging
.github/workflows/   — CI və Deploy pipeline
```

## Deployment

### 1. GitHub CI (avtomatik)

Push/PR → `ci.yml` işləyir: lint, TypeScript, production build.

### 2. Vercel (canlı)

1. [vercel.com](https://vercel.com) → New Project → GitHub repo
2. Environment Variables (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `JWT_SECRET` (min 32 simvol)
   - `SUPABASE_SERVICE_ROLE_KEY`
3. GitHub → Settings → Secrets and variables → Actions:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

`main` → production deploy | `staging` → preview deploy

### 3. Branch strategiyası

- `develop` — CI only
- `staging` — preview deploy
- `main` — production deploy

## Təhlükəsizlik

- Security headers (CSP, HSTS, X-Frame-Options) — `next.config.ts`
- JWT httpOnly cookie session
- Role-based admin access
- Server-only env ayrımı

## Sənədlər

- `DEPLOYMENT-INSIGHTS.md` — deployment öyrənmə qeydləri
- `e-commerce.md` — funksional tələblər
- `supabase/SETUP-AZ.md` — Supabase quraşdırma (AZ)

## Admin

Supabase `profiles` cədvəlində istifadəçinin `role` sütununu `admin` edin.
