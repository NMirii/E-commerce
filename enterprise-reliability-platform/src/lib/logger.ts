export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: unknown;
}

// Keep a client-accessible buffer of the last 100 log entries for diagnostic dashboard
const MAX_BUFFER_SIZE = 100;
let logBuffer: LogEntry[] = [];

/**
 * Gets the current log buffer.
 */
export function getLogBuffer(): LogEntry[] {
  return [...logBuffer];
}

/**
 * Clears the current log buffer.
 */
export function clearLogBuffer(): void {
  logBuffer = [];
}

// Sensitive keys to scrub (case-insensitive checks)
const SENSITIVE_KEYS = new Set([
  "password",
  "cvv",
  "cvc",
  "cardnumber",
  "creditcard",
  "pan",
  "token",
  "secret",
  "pin",
  "auth",
  "ssn",
  "key",
  "stripe_secret",
  "jwt"
]);

// Credit card pattern: matches 13 to 19 digit numbers, optional spaces/dashes
const CREDIT_CARD_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;

// Email pattern
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

/**
 * Checks if a value is a credit card number using basic Luhn-like validation length check
 */
function isCreditCardLike(str: string): boolean {
  const digits = str.replace(/\D/g, "");
  return digits.length >= 13 && digits.length <= 19;
}

/**
 * Masks credit cards and emails in raw strings.
 */
function maskString(str: string): string {
  let masked = str;

  // Mask emails: john.doe@example.com -> j***e@example.com
  masked = masked.replace(EMAIL_REGEX, (match) => {
    const [local, domain] = match.split("@");
    if (local.length <= 2) return `*@${domain}`;
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  });

  // Mask credit card-like strings
  masked = masked.replace(CREDIT_CARD_REGEX, (match) => {
    if (isCreditCardLike(match)) {
      const clean = match.replace(/\D/g, "");
      const lastFour = clean.slice(-4);
      return `****-****-****-${lastFour}`;
    }
    return match;
  });

  return masked;
}

/**
 * Recursively masks sensitive fields inside objects, arrays, and primitives.
 */
export function maskSensitiveData(val: unknown): unknown {
  if (val === null || val === undefined) return val;

  if (typeof val === "string") {
    return maskString(val);
  }

  if (Array.isArray(val)) {
    return val.map(maskSensitiveData);
  }

  if (typeof val === "object") {
    // If it's an Error object, preserve standard fields but mask message/stack
    if (val instanceof Error) {
      return {
        name: val.name,
        message: maskString(val.message),
        stack: val.stack ? maskString(val.stack) : undefined,
      };
    }

    const scrubbed: Record<string, unknown> = {};
    const obj = val as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      
      if (SENSITIVE_KEYS.has(lowerKey) || Array.from(SENSITIVE_KEYS).some(k => lowerKey.includes(k))) {
        scrubbed[key] = "[MASKED]";
      } else {
        scrubbed[key] = maskSensitiveData(obj[key]);
      }
    }
    return scrubbed;
  }

  return val;
}

/**
 * Structured log helper.
 */
function logWrite(level: LogLevel, message: string, context?: unknown) {
  const isProd = process.env.NODE_ENV === "production";
  
  // 1. Mask sensitive info from message and context
  const maskedMessage = maskString(message);
  const maskedContext = context ? maskSensitiveData(context) : undefined;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message: maskedMessage,
    context: maskedContext,
  };

  // 2. Add to log buffer
  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift();
  }

  // 3. Output to console with proper formatting
  if (isProd) {
    // Standard structured JSON logging in production
    const logOutput = JSON.stringify(entry);
    if (level === "ERROR" || level === "FATAL") {
      console.error(logOutput);
    } else if (level === "WARN") {
      console.warn(logOutput);
    } else {
      console.log(logOutput);
    }
  } else {
    // Elegant, color-highlighted console logs for development
    const colorMap: Record<LogLevel, string> = {
      DEBUG: "\x1b[34m", // Blue
      INFO: "\x1b[32m",  // Green
      WARN: "\x1b[33m",  // Yellow
      ERROR: "\x1b[31m", // Red
      FATAL: "\x1b[35m", // Magenta
    };
    const color = colorMap[level] || "\x1b[37m";
    const reset = "\x1b[0m";

    const timeStr = entry.timestamp.split("T")[1].slice(0, 8);
    const prefix = `${color}[${level}][${timeStr}]${reset}`;
    
    if (level === "ERROR" || level === "FATAL") {
      console.error(prefix, maskedMessage, maskedContext !== undefined ? maskedContext : "");
    } else if (level === "WARN") {
      console.warn(prefix, maskedMessage, maskedContext !== undefined ? maskedContext : "");
    } else {
      console.log(prefix, maskedMessage, maskedContext !== undefined ? maskedContext : "");
    }
  }
}

export const logger = {
  debug: (msg: string, ctx?: unknown) => logWrite("DEBUG", msg, ctx),
  info: (msg: string, ctx?: unknown) => logWrite("INFO", msg, ctx),
  warn: (msg: string, ctx?: unknown) => logWrite("WARN", msg, ctx),
  error: (msg: string, ctx?: unknown) => logWrite("ERROR", msg, ctx),
  fatal: (msg: string, ctx?: unknown) => logWrite("FATAL", msg, ctx),
};

