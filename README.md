# Welcome to 06 Deployment
***

## Task

Deploy a production-ready enterprise e-commerce platform (`enterprise-deployment-platform` / GreenShop) with industry-grade reliability, security, and automation.

The problem is moving a full-stack Next.js e-commerce application from local development to a secure, monitored, multi-environment production setup. The platform must handle customer data, payments, inventory, and admin operations while meeting real-world deployment standards.

The challenge is environment management (public vs server-only secrets across dev, staging, and production), CI/CD reliability (lint, type-check, and build on every push), safe promotion from staging to production with rollback options, e-commerce compliance (payment security, audit trails, security headers), and global performance (optimized builds, Web Vitals, edge deployment on Vercel).

## Description

The platform is built with Next.js 16, React 19, TypeScript, and Supabase. It includes a customer storefront (catalog, cart, checkout), admin dashboard (products, orders, inventory alerts), JWT authentication, REST API routes, and Server Actions.

Production configuration uses centralized env validation with Zod (`src/lib/env.ts`), security headers in `next.config.ts` (CSP, HSTS, X-Frame-Options), and structured error logging with Web Vitals hooks (`src/lib/monitoring.ts`).

CI/CD is handled by GitHub Actions: `ci.yml` runs lint, TypeScript check, and production build on every push/PR; `deploy.yml` deploys to Vercel preview on `staging` and production on `main`.

Multi-environment flow: local development → `staging` branch (preview) → `main` branch (production). CI uses placeholder env vars so builds pass without exposing real secrets.

E-commerce security includes JWT httpOnly cookies, role-based admin access, rate limiting, audit logs, payment webhook stub, and Supabase RLS with server-only keys.

See `DEPLOYMENT-INSIGHTS.md` for detailed deployment notes.

## Installation

Requirements: Node.js 20+, npm, Supabase account.

```bash
git clone https://github.com/NMirii/E-commerce.git
cd E-commerce
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-secret-minimum-32-characters
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Run `supabase/schema.sql` in the Supabase SQL Editor.

For production deploy on Vercel: connect the GitHub repo, add the same environment variables in project settings, and set GitHub Actions secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).

## Usage

Local development:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Production build and run:

```bash
npm run build
npm run start
```

Quality checks (same as CI):

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Optional seed:

```bash
npm run seed:1000
```

Branch workflow: `develop` (CI only) → `staging` (Vercel preview) → `main` (Vercel production).

Admin access: set `role = admin` for a user in the Supabase `profiles` table.

### The Core Team

- **Platform:** E-commerce (GreenShop)
- **Stack:** Next.js 16 · React 19 · Supabase · GitHub Actions · Vercel

<span><i>Made at <a href='https://qwasar.io'>Qwasar SV -- Software Engineering School</a></i></span>
<span><img alt='Qwasar SV -- Software Engineering School's Logo' src='https://storage.googleapis.com/qwasar-public/qwasar-logo_50x50.png' width='20px' /></span>
