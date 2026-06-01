import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "./session";
import type { SessionUser } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getAuthenticatedDb(): Promise<{
  session: SessionUser;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: SupabaseClient<any>;
} | null> {
  const session = await getSession();
  if (!session) return null;
  return { session, db: createServiceClient() };
}
