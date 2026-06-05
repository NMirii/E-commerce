import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv, hasSupabaseEnv } from "./env";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let serviceClient: SupabaseClient<any> | null = null;

/**
 * Server-only Supabase client (bypasses RLS).
 * Required for JWT-authenticated writes (cart, orders, admin).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createServiceClient(): SupabaseClient<any> {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase konfiqurasiyası tapılmadı");
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY təyin edilməyib. JWT auth ilə qorunan əməliyyatlar üçün lazımdır (Supabase → Settings → API → Secret key)."
    );
  }

  if (!serviceClient) {
    const { url } = getSupabaseEnv();
    serviceClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return serviceClient;
}
