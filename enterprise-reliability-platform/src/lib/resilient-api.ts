import { logger } from "./logger";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitConfig {
  failureThreshold: number; // Number of failures before tripping
  cooldownPeriodMs: number; // Time before trying a request in HALF_OPEN
}

interface CircuitStatus {
  state: CircuitState;
  failures: number;
  lastFailureTime: number | null;
  serviceName: string;
}

// Global registry of active circuit states in memory
const circuitsRegistry = new Map<string, CircuitStatus>();

const DEFAULT_CONFIG: CircuitConfig = {
  failureThreshold: 3,
  cooldownPeriodMs: 10000, // 10 seconds cooldown
};

/**
 * Gets the status of all circuits in the registry for dashboard reporting.
 */
export function getCircuitsStatus(): CircuitStatus[] {
  return Array.from(circuitsRegistry.values());
}

/**
 * Resets a circuit state manually.
 */
export function resetCircuit(serviceName: string): void {
  circuitsRegistry.set(serviceName, {
    state: "CLOSED",
    failures: 0,
    lastFailureTime: null,
    serviceName,
  });
  logger.info(`Circuit '${serviceName}' manual reset success.`);
}

/**
 * Trip a circuit manually for simulation testing.
 */
export function tripCircuit(serviceName: string): void {
  circuitsRegistry.set(serviceName, {
    state: "OPEN",
    failures: 5,
    lastFailureTime: Date.now(),
    serviceName,
  });
  logger.warn(`Circuit '${serviceName}' manually tripped (OPEN) for testing.`);
}

/**
 * A helper to sleep for a specified duration (ms).
 */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ResilientOptions extends RequestInit {
  serviceName?: string;
  maxRetries?: number;
  backoffFactor?: number;
  circuitConfig?: CircuitConfig;
}

/**
 * Resilient Fetch wrapper implementing Circuit Breakers and Exponential Backoff.
 */
export async function resilientFetch(
  input: RequestInfo | URL,
  options: ResilientOptions = {}
): Promise<Response> {
  const serviceName = options.serviceName || "default-api";
  const maxRetries = options.maxRetries ?? 3;
  const backoffFactor = options.backoffFactor ?? 2;
  const config = options.circuitConfig || DEFAULT_CONFIG;

  // 1. Get or create circuit state
  if (!circuitsRegistry.has(serviceName)) {
    circuitsRegistry.set(serviceName, {
      state: "CLOSED",
      failures: 0,
      lastFailureTime: null,
      serviceName,
    });
  }
  const circuit = circuitsRegistry.get(serviceName)!;

  // 2. Evaluate circuit state
  if (circuit.state === "OPEN") {
    if (circuit.lastFailureTime && Date.now() - circuit.lastFailureTime > config.cooldownPeriodMs) {
      circuit.state = "HALF_OPEN";
      logger.warn(`Circuit '${serviceName}' transitioned to HALF_OPEN. Probing connection...`);
    } else {
      logger.error(`Circuit '${serviceName}' is OPEN. Request blocked immediately.`);
      throw new Error(`CircuitBreakerOpen: Service '${serviceName}' is temporarily down.`);
    }
  }

  let attempt = 0;
  let delay = 500; // start with 500ms delay

  while (attempt <= maxRetries) {
    try {
      attempt++;
      
      // Probe or Standard Request
      const response = await fetch(input, options);

      // Handle Rate Limiting (429) specifically
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get("Retry-After");
        const rateLimitCooldown = retryAfterHeader 
          ? parseInt(retryAfterHeader, 10) * 1000 
          : delay * backoffFactor;

        logger.warn(`Rate limit hit (429) on service '${serviceName}'. Cooldown ${rateLimitCooldown}ms before retry.`);
        
        if (attempt <= maxRetries) {
          await sleep(rateLimitCooldown);
          delay = rateLimitCooldown;
          continue; // retry
        }
      }

      // Handle server-side crashes (5xx errors) as failures that trip circuit breaker
      if (response.status >= 500) {
        throw new Error(`ServerError: Received status code ${response.status} from ${serviceName}`);
      }

      // If we reach here, request succeeded
      if (circuit.state === "HALF_OPEN" || circuit.failures > 0) {
        logger.info(`Circuit '${serviceName}' recovered. Transitioning to CLOSED.`);
      }
      
      circuit.state = "CLOSED";
      circuit.failures = 0;
      circuit.lastFailureTime = null;

    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.warn(`Attempt ${attempt} failed for service '${serviceName}': ${errMsg}`);

      if (attempt > maxRetries) {
        // Increment failures, evaluate circuit trip
        circuit.failures++;
        circuit.lastFailureTime = Date.now();

        if (circuit.failures >= config.failureThreshold) {
          circuit.state = "OPEN";
          logger.fatal(`Circuit '${serviceName}' tripped (OPEN) due to ${circuit.failures} consecutive failures. Threshold: ${config.failureThreshold}`);
        }
        
        throw err;
      }

      // Wait before next retry
      const backoffDelay = delay * Math.pow(backoffFactor, attempt - 1);
      logger.info(`Sleeping ${backoffDelay}ms before retry attempt ${attempt + 1}...`);
      await sleep(backoffDelay);
    }
  }

  throw new Error(`Request to '${serviceName}' failed after maximum retry attempts.`);
}
