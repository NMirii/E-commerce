import { z } from "zod";

/** Zod v4 uses `issues`; older snippets used `errors`. */
export function zodFirstMessage(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Validation failed";
}

export function zodIssues(err: z.ZodError) {
  return err.issues;
}

export function errorMessage(error: unknown, fallback = "Internal Server Error") {
  return error instanceof Error ? error.message : fallback;
}
