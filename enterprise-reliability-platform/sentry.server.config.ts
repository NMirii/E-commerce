import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "https://examplePublicKey@o0.ingest.sentry.io/0",

  // Adjust traces sample rate for performance monitoring
  tracesSampleRate: 1.0,

  debug: false,
});
