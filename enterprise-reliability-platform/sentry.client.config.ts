import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://examplePublicKey@o0.ingest.sentry.io/0",
  
  // Re-tune this value in production environment
  tracesSampleRate: 1.0,

  // Adjust debug flags
  debug: false,

  // Enable Replay session monitoring if needed
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
});
