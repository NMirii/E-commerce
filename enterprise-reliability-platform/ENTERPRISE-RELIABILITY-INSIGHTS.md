# Enterprise Reliability Engineering & Debugging Mastery

## Overview

This document provides comprehensive guidance on the enterprise-grade reliability, monitoring, and error handling framework integrated into the GreenShop E-commerce platform. The system is designed to ensure **production-grade resilience**, **PCI-compliant data handling**, **circuit breaker protection**, and **comprehensive observability** across all application layers.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Sentry Integration](#sentry-integration)
3. [Error Handling Framework](#error-handling-framework)
4. [Custom Logger & PCI Compliance](#custom-logger--pci-compliance)
5. [Resilient API Integration](#resilient-api-integration)
6. [React Error Boundaries](#react-error-boundaries)
7. [Hydration Safety](#hydration-safety)
8. [Reliability Dashboard](#reliability-dashboard)
9. [Testing & Verification](#testing--verification)
10. [Deployment Checklist](#deployment-checklist)

---

## System Architecture

### High-Level Component Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  ┌───────────────────────────────────────────────────────┐ │
│  │         React Components & Server Actions             │ │
│  └──────────────────┬──────────────────────────────────┬─┘ │
└─────────────────────┼──────────────────────────────────┼────┘
                      │                                  │
        ┌─────────────┴────────┐              ┌─────────┴───────┐
        │                      │              │                 │
   ┌────▼──────────┐   ┌──────▼────┐    ┌───▼────────┐   ┌───▼────────┐
   │  ErrorBoundary│   │HydrationSafe   │   Logger   │   │ResilientFetch
   │               │   │  Component │    │ (PCI-Safe) │   │(Circuit Breaker)
   └────┬──────────┘   └──────┬────┘    └───┬────────┘   └───┬────────┘
        │                     │              │               │
        └─────────────────────┴──────────────┴───────────────┘
                      │
        ┌─────────────▼──────────────┐
        │   Sentry Error Tracker     │
        │  (Client/Server/Edge)      │
        └──────────────────────────┘
```

### Key Components

| Component | Purpose | Layer |
|-----------|---------|-------|
| **ErrorBoundary** | Catch React lifecycle errors and render fallback UI | Client |
| **Global Error Handler** | Capture root-level unhandled exceptions | Client/Server |
| **Custom Logger** | Structured logging with PCI data masking | All |
| **ResilientFetch** | HTTP wrapper with circuit breakers & retries | Client/Server |
| **HydrationSafe** | Prevent hydration mismatches in dynamic content | Client |
| **Sentry SDK** | Real-time error reporting and performance monitoring | All |
| **Reliability Dashboard** | Admin panel for monitoring, logging, and diagnostics | Server |

---

## Sentry Integration

### Configuration Files

#### 1. **Client-Side Sentry** (`sentry.client.config.ts`)

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0, // Adjust in production for high-traffic apps
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1, // 10% session recording
  debug: false,
});
```

**Why This Matters:**
- **Browser errors** are captured in real-time (XSS, hydration, runtime crashes)
- **Session replay** helps debug user-facing issues
- **Performance traces** identify slow interactions

#### 2. **Server-Side Sentry** (`sentry.server.config.ts`)

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
});
```

**Captures:**
- Database query failures
- Third-party API timeouts
- Unhandled promise rejections in Server Actions
- Rate-limit violations

#### 3. **Edge-Side Sentry** (`sentry.edge.config.ts`)

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
});
```

**Captures:**
- Middleware failures
- Request validation errors
- Authentication/authorization failures

#### 4. **Next.js Configuration** (`next.config.ts`)

```typescript
import { withSentryConfig } from "@sentry/nextjs";

const sentryConfig = withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: "greenshop",
    project: "greenshop-ecommerce",
  }
);
```

**Benefits:**
- Automatic source map uploads to Sentry
- Runtime error detection
- Performance monitoring

### Environment Variables Required

```bash
# Set your Sentry DSN from https://sentry.io
NEXT_PUBLIC_SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project_id>
SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project_id>
```

---

## Error Handling Framework

### Global Error Handler (`src/app/global-error.tsx`)

The root-level error boundary that catches **unhandled exceptions** and **server-side crashes**:

```tsx
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Report to Sentry immediately
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        {/* Dark-themed, user-friendly error page */}
      </body>
    </html>
  );
}
```

**Error Scenarios Handled:**
- ✅ Unhandled React component crashes
- ✅ Server-side runtime exceptions
- ✅ Middleware failures
- ✅ API route errors

### Component-Level Error Boundaries

Use `<ErrorBoundary>` wrapper for isolated error containment:

```tsx
import { ErrorBoundary } from "@/components/reliability/ErrorBoundary";
import { PaymentErrorFallback } from "@/components/reliability/PaymentErrorFallback";

export default function CheckoutPage() {
  return (
    <ErrorBoundary
      actionName="CheckoutPayment"
      fallback={<PaymentErrorFallback error={new Error("Payment failed")} reset={() => {}} />}
    >
      <PaymentForm />
    </ErrorBoundary>
  );
}
```

**Fallback Components:**
- `PaymentErrorFallback` - Handles payment gateway timeouts (PCI-safe, no card details exposed)
- `InventoryErrorFallback` - Handles inventory sync failures (allows product reload)
- Custom fallback UI - Pass a React component or function

---

## Custom Logger & PCI Compliance

### Overview

The custom logger (`src/lib/logger.ts`) implements **enterprise-grade structured logging** with **automatic sensitive data masking**:

```typescript
import { logger } from "@/lib/logger";

// Simple usage
logger.info("User logged in", { userId: "123", action: "LOGIN" });

// Sensitive data is automatically masked
logger.error("Payment failed", {
  cardNumber: "4532-1234-5678-9012", // ✅ Becomes ****-****-****-9012
  cvv: "123",                         // ✅ Becomes [MASKED]
  email: "john.doe@example.com"       // ✅ Becomes j***e@example.com
});
```

### Log Levels

| Level | Use Case | Priority |
|-------|----------|----------|
| **DEBUG** | Development-only diagnostics | Low |
| **INFO** | Normal system events | Low |
| **WARN** | Recoverable issues (rate-limit, timeout) | Medium |
| **ERROR** | Service failures (payment API down) | High |
| **FATAL** | System-level failures | Critical |

### PCI-Compliant Data Masking

The logger automatically scrubs:

✅ **Credit Card Numbers** → `****-****-****-9012`
✅ **CVV/CVC Codes** → `[MASKED]`
✅ **Email Addresses** → `j***e@example.com`
✅ **Passwords** → `[MASKED]`
✅ **SSN/Tax IDs** → `[MASKED]`
✅ **JWT Tokens** → `[MASKED]`

**Example:**

```typescript
logger.error("Transaction failed", {
  userEmail: "customer@example.com",
  cardNumber: "5412345678901234",
  cvv: "456",
  transactionId: "TXN-12345"
});

// Output (automatically scrubbed):
// {
//   timestamp: "2026-06-05T12:34:56.789Z",
//   level: "ERROR",
//   message: "Transaction failed",
//   context: {
//     userEmail: "c***r@example.com",
//     cardNumber: "****-****-****-1234",
//     cvv: "[MASKED]",
//     transactionId: "TXN-12345"
//   }
// }
```

### Accessing Logs in Dashboard

The log buffer is accessible via the **Reliability Dashboard** (`/admin/reliability`):

```typescript
import { getLogBuffer, clearLogBuffer } from "@/lib/logger";

// Get last 100 logs
const recentLogs = getLogBuffer();

// Clear the buffer
clearLogBuffer();
```

---

## Resilient API Integration

### Circuit Breaker Pattern

The `resilientFetch` function implements **circuit breaker logic** to protect against cascading failures:

```typescript
import { resilientFetch } from "@/lib/resilient-api";

// Fetch with automatic retries and circuit breaker
const response = await resilientFetch(
  "https://payment-gateway.example.com/charge",
  {
    serviceName: "payment-gateway",
    maxRetries: 3,
    backoffFactor: 2, // Exponential backoff: 500ms, 1s, 2s, 4s
    circuitConfig: {
      failureThreshold: 3, // Trip after 3 consecutive failures
      cooldownPeriodMs: 10000, // Try again after 10 seconds
    }
  }
);
```

### Circuit Breaker States

| State | Behavior | When Entered |
|-------|----------|--------------|
| **CLOSED** | ✅ Requests flow normally | Service is healthy |
| **OPEN** | ❌ All requests blocked immediately | Failure threshold exceeded |
| **HALF_OPEN** | 🔄 One probe request allowed | Cooldown period elapsed |

**Flow Diagram:**

```
CLOSED (service healthy)
  ↓ [consecutive failures >= threshold]
OPEN (service down, block all requests)
  ↓ [cooldown period elapsed, retry probe]
HALF_OPEN (test single request)
  ├─ [probe succeeds] → CLOSED ✅
  └─ [probe fails] → OPEN ❌
```

### Exponential Backoff with Jitter

```typescript
// Retry delays: 500ms, 1s, 2s, 4s (with jitter)
await resilientFetch(url, {
  maxRetries: 3,
  backoffFactor: 2,
  // Actual delays: 500ms ± random(0-100ms), 1s ± random(0-200ms), etc.
});
```

### Rate Limit Handling (HTTP 429)

```typescript
// If service returns 429 (Too Many Requests):
// - Extracts "Retry-After" header if present
// - Waits the specified duration
// - Retries automatically
// - Respects max retry limit
```

### Manual Circuit Breaker Management

```typescript
import { 
  resetCircuit, 
  tripCircuit, 
  getCircuitsStatus 
} from "@/lib/resilient-api";

// Get status of all circuits
const status = getCircuitsStatus();

// Manually reset a circuit (restore to CLOSED)
resetCircuit("payment-gateway");

// Manually trip a circuit for testing
tripCircuit("payment-gateway");
```

---

## React Error Boundaries

### ErrorBoundary Component

The `ErrorBoundary` class component catches React lifecycle errors and renders a fallback UI:

```tsx
import { ErrorBoundary } from "@/components/reliability/ErrorBoundary";

export default function ProductPage() {
  return (
    <ErrorBoundary
      actionName="ProductDetailLoad"
      fallback={(error, reset) => (
        <div className="p-8 bg-red-100 rounded-lg">
          <h3>Something went wrong loading this product</h3>
          <button onClick={reset}>Try Again</button>
        </div>
      )}
    >
      <ProductDetail productId="123" />
    </ErrorBoundary>
  );
}
```

### Error Fallback Components

#### **PaymentErrorFallback**

Specialized UI for payment processing failures:
- ✅ Does NOT expose payment card details
- ✅ Shows transaction reference ID
- ✅ Offers "Retry Payment" and "Reload" buttons
- ✅ PCI-compliant messaging

```tsx
<ErrorBoundary fallback={<PaymentErrorFallback />}>
  <CheckoutForm />
</ErrorBoundary>
```

#### **InventoryErrorFallback**

Specialized UI for inventory synchronization failures:
- ✅ Explains stock sync issue to user
- ✅ Offers product reload option
- ✅ Allows bypassing broken component

```tsx
<ErrorBoundary fallback={<InventoryErrorFallback />}>
  <ProductAvailability />
</ErrorBoundary>
```

### Error Tracking Integration

When an error is caught, ErrorBoundary automatically:

1. **Logs** the error with `logger.error()`
2. **Captures** in Sentry with context tags
3. **Renders** appropriate fallback UI
4. **Provides** reset handler for user retry

---

## Hydration Safety

### The Hydration Mismatch Problem

**What is hydration?**
Server renders HTML → Browser downloads React → React "hydrates" (attaches event listeners)

**Problem:** If server output ≠ client output → React throws error

**Example:**

```tsx
// ❌ WRONG: Server renders one thing, client renders another
export function UserGreeting() {
  // Server sees window === undefined, renders "Welcome, Guest"
  // Client sees window, renders "Welcome, John"
  const username = typeof window !== "undefined" ? "John" : "Guest";
  return <p>Welcome, {username}</p>;
}
```

### HydrationSafe Component

The `HydrationSafe` wrapper prevents mismatches by delaying dynamic content until hydration completes:

```tsx
import { HydrationSafe } from "@/components/reliability/HydrationSafe";

export function UserGreeting() {
  return (
    <HydrationSafe
      fallback={<p>Welcome, Guest</p>}
    >
      <p>Welcome, John</p>
    </HydrationSafe>
  );
}
```

**How it works:**
1. **Server-side:** Renders the `fallback`
2. **Client hydration:** Static markup matches
3. **After hydration:** Swaps in the dynamic `children`

### useIsHydrated Hook

For inline hydration checks:

```tsx
import { useIsHydrated } from "@/components/reliability/HydrationSafe";

export function LocalTime() {
  const isHydrated = useIsHydrated();

  if (!isHydrated) {
    return <p>Loading time...</p>;
  }

  return <p>{new Date().toLocaleTimeString()}</p>;
}
```

---

## Reliability Dashboard

### Accessing the Dashboard

Navigate to: **`/admin/reliability`**

### Features

#### 1. **Live Log Viewer**

- Real-time log buffer display (last 100 entries)
- Filter by log level (DEBUG, INFO, WARN, ERROR, FATAL)
- Search by message content
- View full context by expanding logs
- Auto-refresh every 5 seconds

#### 2. **Circuit Breaker Status**

- Monitor all active circuits (payment gateway, inventory API, etc.)
- View state: CLOSED ✅, OPEN ❌, HALF_OPEN 🔄
- Track failure counts
- Manually reset or trip circuits for testing

#### 3. **Memory Metrics**

- RSS (Resident Set Size)
- Heap Used / Heap Total
- Real-time updates

#### 4. **Error Simulation Tools**

**Simulate Payment Error:**
```
Click "Ödəniş Səhvini Simulyasiya Et"
→ Triggers payment error boundary
→ Fallback displays
→ Error logged to Sentry
```

**Simulate Inventory Error:**
```
Click "Anbar Səhvini Simulyasiya Et"
→ Triggers inventory error boundary
→ Fallback displays with reload option
```

**Simulate Hydration Mismatch:**
```
View "[Hydration Error Source]" section
→ Displays server vs client text
→ Tests hydration safety mechanisms
```

**Simulate Memory Leak:**
```
Click "Memory Leak Simulasyon Başlat"
→ Allocates 10MB every second
→ Watch memory usage climb
→ Click "Stop Simulation" to end
```

#### 5. **Resilient API Testing**

- Trigger a test fetch request
- View retry attempts and circuit breaker decisions
- Monitor rate limiting behavior
- Test timeout scenarios

### Dashboard Architecture

```typescript
// ReliabilityDashboardView.tsx

// 1. Fetch diagnostics data
const fetchDiagnostics = async () => {
  const [logsRes, circuitsRes, memoryRes] = await Promise.all([
    fetch("/api/diagnostics/logs"),
    fetch("/api/diagnostics/circuits"),
    fetch("/api/diagnostics/memory")
  ]);
  // Process and display...
};

// 2. Simulate errors
const simulatePaymentError = () => {
  setShouldCrash(true); // Triggers error boundary
};

// 3. Trigger API calls with resilient fetch
const testResilientFetch = async () => {
  const response = await resilientFetch(
    "/api/test-endpoint",
    { serviceName: "test-api", maxRetries: 3 }
  );
};
```

---

## Testing & Verification

### 1. Lint Check

```bash
cd enterprise-reliability-platform
npm run lint
```

✅ Verifies no TypeScript errors
✅ Checks ESLint rules compliance

### 2. TypeScript Compilation

```bash
npx tsc --noEmit
```

✅ Verifies all types are correct
✅ No implicit `any` types
✅ Detects dead code

### 3. Build Verification

```bash
npm run build
```

✅ Next.js static export succeeds
✅ All source maps generated
✅ Bundle size optimal

### 4. Local Development

```bash
npm run dev
```

Navigate to:
- `http://localhost:3000` - Main store
- `http://localhost:3000/admin/reliability` - Dashboard

### 5. Manual Test Scenarios

#### **Scenario 1: Client-Side Crash**

1. Navigate to `/admin/reliability`
2. Scroll to "Ödəniş Səhvini Simulyasiya Et"
3. Click button
4. ✅ Error boundary catches error
5. ✅ Fallback UI displays
6. ✅ Sentry receives error event
7. ✅ Log buffer populated

#### **Scenario 2: Payment Gateway Timeout**

1. In Reliability Dashboard, find Circuit Breaker section
2. Locate "payment-gateway" circuit
3. Click "Trip Circuit"
4. Attempt payment checkout
5. ✅ Circuit is OPEN
6. ✅ Request blocked immediately
7. ✅ User sees fallback UI
8. ✅ Log shows circuit blocked event

#### **Scenario 3: Hydration Mismatch**

1. View the "Hydration Error Source" section
2. ✅ Server renders: "Server Sessiyası: Default Server"
3. ✅ After hydration: "Müştəri Sessiyası: Active Client"
4. ✅ No hydration mismatch error in console

#### **Scenario 4: Memory Leak Detection**

1. Click "Memory Leak Simulasyon Başlat"
2. Monitor memory metrics updating
3. ✅ Memory RSS increases every second
4. ✅ Alert triggered when > threshold
5. Click "Simulasyon Dayandır"
6. ✅ Memory cleanup begins

#### **Scenario 5: Rate Limiting**

1. Configure test API to return 429
2. Trigger resilient fetch
3. ✅ First request fails with 429
4. ✅ Extracts "Retry-After" header
5. ✅ Waits specified duration
6. ✅ Retries automatically
7. ✅ Log shows rate limit event

### 6. Error Reporting Verification

**Check Sentry Dashboard:**

1. Visit `https://sentry.io/organizations/greenshop/`
2. Navigate to "greenshop-ecommerce" project
3. Verify recent errors appear under "Issues"
4. Confirm error metadata (userId, action, severity)
5. View session replay if configured

---

## Deployment Checklist

### Pre-Deployment

- [ ] All TypeScript errors resolved (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables set:
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `SENTRY_DSN`
- [ ] Sentry project created and configured
- [ ] Source maps uploaded to Sentry
- [ ] Error scenarios tested locally

### Deployment Commands

```bash
# Install dependencies
npm install

# Build application
npm run build

# Verify build output
ls -la .next/

# Deploy to hosting (Vercel, AWS, etc.)
# Next.js deployment commands vary by platform
```

### Post-Deployment

- [ ] Test `/admin/reliability` page loads
- [ ] Trigger test error and verify Sentry reports
- [ ] Monitor error rates in first 24 hours
- [ ] Verify circuit breakers working with production APIs
- [ ] Check log buffer populated with production events
- [ ] Validate performance metrics in Sentry

---

## Common Issues & Troubleshooting

### Issue: Sentry DSN not set

**Symptom:** Errors not appearing in Sentry, console warns about missing DSN

**Solution:**
```bash
# Set environment variables
export NEXT_PUBLIC_SENTRY_DSN="https://<key>@<org>.ingest.sentry.io/<project>"
export SENTRY_DSN="https://<key>@<org>.ingest.sentry.io/<project>"
```

### Issue: Hydration mismatch errors in console

**Symptom:** "Text content does not match server-rendered HTML"

**Solution:**
```tsx
// Wrap dynamic content with HydrationSafe
import { HydrationSafe } from "@/components/reliability/HydrationSafe";

<HydrationSafe fallback={<Skeleton />}>
  <ClientOnlyComponent />
</HydrationSafe>
```

### Issue: Circuit breaker stuck in OPEN state

**Symptom:** All requests to service blocked, even after service recovers

**Solution:**
```typescript
import { resetCircuit } from "@/lib/resilient-api";

// Manually reset the circuit via admin dashboard
resetCircuit("payment-gateway");

// Or programmatically:
// Navigate to /admin/reliability and click reset button
```

### Issue: Sensitive data leaked in logs

**Symptom:** Credit card numbers appearing in log files

**Solution:**
```typescript
// Logger automatically masks sensitive fields
// Verify by checking dashboard logs:
logger.error("Payment processed", {
  cardNumber: "4532-1111-2222-3333", // Auto-masked to ****-****-****-3333
  amount: 99.99 // Safe to log
});
```

---

## Learning Milestones

### Level 1: Foundation
- ✅ Understand error boundary pattern
- ✅ Configure Sentry DSN
- ✅ Deploy and verify error reporting

### Level 2: Intermediate
- ✅ Implement custom error fallbacks
- ✅ Use circuit breaker for API protection
- ✅ Create specialized error pages

### Level 3: Advanced
- ✅ Analyze error patterns in Sentry
- ✅ Optimize retry strategies
- ✅ Implement custom monitoring metrics

### Level 4: Mastery
- ✅ Build custom error analytics
- ✅ Design resilience patterns
- ✅ Mentor team on error handling best practices

---

## Additional Resources

- [Sentry Docs](https://docs.sentry.io/)
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Circuit Breaker Pattern](https://en.wikipedia.org/wiki/Circuit_breaker_pattern)
- [PCI DSS Compliance](https://www.pcisecuritystandards.org/)

---

**Document Version:** 1.0  
**Last Updated:** June 5, 2026  
**Platform:** Enterprise E-commerce  
**Author:** GreenShop Engineering Team
