const PLACEHOLDER_URL = "https://your-project.supabase.co";
const PLACEHOLDER_KEY = "your-anon-key";

function readEnv() {
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    "";

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    anonKey,
  };
}

export function hasSupabaseEnv(): boolean {
  const { url, anonKey } = readEnv();
  if (!url || !anonKey) return false;
  if (url === PLACEHOLDER_URL || anonKey === PLACEHOLDER_KEY) return false;
  if (url.includes("your-project") || anonKey.includes("your-anon")) return false;
  return true;
}

export function getSupabaseEnv() {
  const { url, anonKey } = readEnv();

  if (!hasSupabaseEnv()) {
    throw new Error(
      "Supabase konfiqurasiyası tapılmadı. .env.example faylını .env.local kimi kopyalayın və NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY dəyərlərini doldurun."
    );
  }

  return { url, anonKey };
}
