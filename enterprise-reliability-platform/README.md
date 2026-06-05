# Enterprise Reliability Platform – GreenShop E-commerce

> **Production-Ready E-commerce Platform with Enterprise-Grade Reliability, Error Handling, and Monitoring**

---

## 🎯 Overview

This is a fully-featured **Next.js 16 + React 19 e-commerce platform** with comprehensive **enterprise reliability engineering** including:

✅ **Sentry Integration** – Real-time error reporting across client, server, and edge  
✅ **React Error Boundaries** – Graceful error fallbacks with custom UI  
✅ **Circuit Breaker Pattern** – Protection against cascading failures  
✅ **PCI-Compliant Logging** – Automatic sensitive data masking  
✅ **Hydration Safety** – Prevent server/client mismatch errors  
✅ **Reliability Dashboard** – Monitor logs, circuits, and memory metrics  
✅ **Resilient APIs** – Retry logic, exponential backoff, rate limiting  

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Running the Platform](#running-the-platform)
4. [Reliability Features](#reliability-features)
5. [Verification & Testing](#verification--testing)
6. [Deployment Guide](#deployment-guide)
7. [Troubleshooting](#troubleshooting)
8. [Documentation](#documentation)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org/))
- **npm** or **yarn**
- **Supabase** account ([create free](https://supabase.com/))
- **Sentry** account ([create free](https://sentry.io/))

### Installation

```bash
# Navigate to enterprise-reliability-platform directory
cd enterprise-reliability-platform

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

---

## 🔐 Environment Setup

### Required Environment Variables

Create `.env.local` with the following:

```bash
# ==================== SUPABASE ====================
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ==================== AUTHENTICATION ====================
JWT_SECRET=your-secret-minimum-32-characters-long

# ==================== SENTRY (REQUIRED FOR ERROR TRACKING) ====================
NEXT_PUBLIC_SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>

# ==================== OPTIONAL ====================
NODE_ENV=development # or production
VERCEL_URL=http://localhost:3000
```

### Getting Your Sentry DSN

1. Go to [Sentry.io](https://sentry.io)
2. Create a new organization and project
3. Select **Next.js** as the platform
4. Copy the DSN (looks like `https://xxx@xxx.ingest.sentry.io/123456`)
5. Add to `.env.local` as both `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN`

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Go to **Settings → API**
4. Copy `URL` and `anon key`
5. Run the schema setup:

```bash
# In Supabase SQL Editor, run:
# 1. supabase/schema.sql
# 2. supabase/seed.sql (optional, for demo data)
```

---

## ▶️ Running the Platform

### Local Development

```bash
npm run dev
```

The application will start at `http://localhost:3000`

**Access points:**
- 🏪 **Store:** `http://localhost:3000`
- 🛒 **Cart:** `http://localhost:3000/cart`
- 📦 **Orders:** `http://localhost:3000/orders`
- 🔐 **Admin:** `http://localhost:3000/admin`
- 📊 **Reliability Dashboard:** `http://localhost:3000/admin/reliability`

### Production Build

```bash
npm run build
npm run start
```

### Linting & Type Checking

```bash
# Check for errors
npm run lint

# TypeScript strict check
npx tsc --noEmit
```

---

## 🛡️ Reliability Features

### 1. Sentry Error Tracking

**Automatic error capture from:**
- React component crashes
- Server Action failures
- API route errors
- Unhandled promise rejections
- Network timeouts

**View errors in:** `https://sentry.io/organizations/greenshop/`

### 2. React Error Boundaries

**Component-level error containment:**

```tsx
import { ErrorBoundary } from "@/components/reliability/ErrorBoundary";
import { PaymentErrorFallback } from "@/components/reliability/PaymentErrorFallback";

export default function Checkout() {
  return (
    <ErrorBoundary
      actionName="PaymentProcess"
      fallback={<PaymentErrorFallback />}
    >
      <CheckoutForm />
    </ErrorBoundary>
  );
}
```

**Available fallbacks:**
- `PaymentErrorFallback` – Payment gateway failures (PCI-safe)
- `InventoryErrorFallback` – Stock sync issues
- Custom fallback – Any React component

### 3. Circuit Breaker Pattern

**Protect against cascading failures:**

```typescript
import { resilientFetch } from "@/lib/resilient-api";

const response = await resilientFetch(
  "https://payment-api.example.com/charge",
  {
    serviceName: "payment-gateway",
    maxRetries: 3,
    backoffFactor: 2,
    circuitConfig: {
      failureThreshold: 3,
      cooldownPeriodMs: 10000
    }
  }
);
```

**Circuit states:**
- 🟢 **CLOSED** – Service healthy, requests flow normally
- 🔴 **OPEN** – Service down, requests blocked immediately
- 🟡 **HALF_OPEN** – Testing service recovery

### 4. PCI-Compliant Logging

**Automatic sensitive data masking:**

```typescript
import { logger } from "@/lib/logger";

logger.error("Payment failed", {
  cardNumber: "4532-1234-5678-9012", // → ****-****-****-9012
  cvv: "123",                         // → [MASKED]
  email: "john@example.com"           // → j***n@example.com
});
```

### 5. Hydration Safety

**Prevent server/client mismatch errors:**

```tsx
import { HydrationSafe } from "@/components/reliability/HydrationSafe";

export function ClientOnlyContent() {
  return (
    <HydrationSafe fallback={<Skeleton />}>
      <DynamicComponent />
    </HydrationSafe>
  );
}
```

### 6. Reliability Dashboard

**Access at:** `http://localhost:3000/admin/reliability`

**Features:**
- 📋 Live log viewer with filtering and search
- 🔌 Circuit breaker status monitoring
- 💾 Memory metrics (RSS, heap usage)
- ⚡ Error simulation tools (payment, inventory, hydration)
- 🧠 Memory leak detector
- 📡 Resilient API testing

---

## ✅ Verification & Testing

### 1. Lint Check

```bash
npm run lint
```

✅ Verifies TypeScript correctness  
✅ Checks ESLint rules  

### 2. Type Checking

```bash
npx tsc --noEmit
```

✅ No implicit `any` types  
✅ All references valid  

### 3. Build Verification

```bash
npm run build
```

✅ Next.js static build succeeds  
✅ All dependencies resolved  
✅ Source maps generated  

### 4. Manual Test Scenarios

#### Test 1: Client-Side Error

1. Navigate to `/admin/reliability`
2. Click **"Ödəniş Səhvini Simulyasiya Et"** (Payment Error Simulation)
3. ✅ Error boundary catches the error
4. ✅ Fallback UI displays
5. ✅ Error appears in Sentry

#### Test 2: Circuit Breaker

1. In Reliability Dashboard, find the circuit breaker section
2. Click **"Trip Circuit"** for payment-gateway
3. Attempt a payment
4. ✅ Request blocked immediately
5. ✅ Circuit shows OPEN state
6. ✅ Log shows blocking event

#### Test 3: Hydration Safety

1. View the **"[Hydration Error Source]"** section
2. ✅ Initially shows: "Server Sessiyası: Default Server"
3. ✅ After hydration: "Müştəri Sessiyası: Active Client"
4. ✅ No hydration errors in console

#### Test 4: Sensitive Data Masking

1. Check the log buffer for any logged payment data
2. ✅ Credit cards masked: `****-****-****-1234`
3. ✅ CVV masked: `[MASKED]`
4. ✅ Emails masked: `j***e@example.com`

#### Test 5: Memory Metrics

1. Click **"Memory Leak Simulasyon Başlat"** (Start Memory Leak Simulation)
2. Monitor memory metrics updating
3. ✅ Memory RSS increases
4. ✅ Alert triggers at threshold
5. Click **"Stop"** to cleanup

---

## 🚢 Deployment Guide

### Deploy to Vercel

**Prerequisites:**
- GitHub account with repo connected
- Vercel account

**Steps:**

1. **Connect GitHub:**
   ```bash
   # Push to GitHub
   git remote add origin https://github.com/YOUR_USER/repo.git
   git push -u origin main
   ```

2. **Link to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select GitHub repo
   - Choose `enterprise-reliability-platform` as root directory

3. **Add Environment Variables:**
   - Go to **Settings → Environment Variables**
   - Add all variables from `.env.local`
   - Verify `NEXT_PUBLIC_SENTRY_DSN` is set

4. **Deploy:**
   ```bash
   git push origin main  # Automatically triggers Vercel deploy
   ```

### Deploy to Self-Hosted

```bash
# Build production bundle
npm run build

# Start production server
npm run start

# Or use PM2 for process management
pm2 start "npm start" --name "greenshop"
```

### Post-Deployment Checks

- [ ] Test `/admin/reliability` dashboard loads
- [ ] Trigger test error and verify Sentry reports
- [ ] Monitor error rates (should be low)
- [ ] Check circuit breakers with production APIs
- [ ] Verify database connections working
- [ ] Test payment flow end-to-end

---

## 🆘 Troubleshooting

### Issue: Sentry DSN not configured

**Error:** "Sentry DSN not provided"

**Solution:**
```bash
# Verify .env.local has both variables
cat .env.local | grep SENTRY_DSN

# Restart dev server
npm run dev
```

### Issue: Hydration mismatch errors

**Error:** "Text content does not match server-rendered HTML"

**Solution:**
```tsx
// Wrap dynamic content
import { HydrationSafe } from "@/components/reliability/HydrationSafe";

<HydrationSafe fallback={<Skeleton />}>
  <ClientComponent />
</HydrationSafe>
```

### Issue: Circuit breaker stuck OPEN

**Error:** All requests to service blocked

**Solution:**
1. Go to `/admin/reliability`
2. Find the stuck circuit
3. Click "Reset Circuit"
4. Service requests resume

### Issue: Build fails with TypeScript errors

**Error:** "Type '...' is not assignable to type '...'"

**Solution:**
```bash
# Check all type errors
npx tsc --noEmit

# Fix reported issues and rebuild
npm run build
```

---

## 📚 Documentation

### Full Technical Documentation

For comprehensive information about reliability architecture, see:

📖 **[ENTERPRISE-RELIABILITY-INSIGHTS.md](./ENTERPRISE-RELIABILITY-INSIGHTS.md)**

Topics covered:
- System architecture diagrams
- Sentry configuration details
- Error handling patterns
- Logger implementation (PCI masking)
- Resilient API with circuit breakers
- React error boundary usage
- Hydration safety mechanisms
- Reliability dashboard features
- Testing and verification procedures
- Deployment checklist
- Troubleshooting guide
- Learning milestones

### Deployment Documentation

For detailed deployment information, see:

📖 **[DEPLOYMENT-INSIGHTS.md](./DEPLOYMENT-INSIGHTS.md)**

---

## 📞 Support

- **Sentry Documentation:** https://docs.sentry.io/
- **Next.js Docs:** https://nextjs.org/docs
- **React Docs:** https://react.dev
- **Supabase Docs:** https://supabase.com/docs

---

## 📝 License

This project is private and proprietary to GreenShop.

---

**Last Updated:** June 5, 2026  
**Platform:** Enterprise E-commerce  
**Version:** 1.0.0

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
