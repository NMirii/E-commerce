/**
 * 1000 məhsul əlavə edir (.env.local lazımdır)
 * İşə salın: node scripts/seed-1000.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const path = resolve(root, ".env.local");
  const raw = readFileSync(path, "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

const CATEGORIES = ["Meyvə", "Çay", "Qida", "Kosmetika", "Ümumi", "Tərəvəz", "Ətir"];
const TOTAL = 1000;
const BATCH = 100;

function productRow(i) {
  const price = Math.round((Math.random() * 95 + 5) * 100) / 100;
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  return {
    title: `Məhsul #${i}`,
    description: `GreenShop kataloqu — məhsul nömrəsi ${i}`,
    price,
    category,
    inventory_count: 1 + Math.floor(Math.random() * 250),
    image_url: `https://picsum.photos/seed/greenshop${i}/400/400`,
    is_active: true,
  };
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey =
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const key = serviceKey || anonKey;

if (!url || !key) {
  console.error("❌ .env.local-də URL və açar yoxdur");
  process.exit(1);
}

if (!serviceKey) {
  console.warn(
    "⚠️  SUPABASE_SERVICE_ROLE_KEY yoxdur — anon ilə insert RLS səbəbindən uğursuz ola bilər."
  );
  console.warn("   Ən asan yol: supabase/seed-1000.sql → Supabase SQL Editor → Run\n");
}

const supabase = createClient(url, key);

const { error: probeErr } = await supabase.from("products").select("id").limit(1);
if (probeErr) {
  console.error("❌ products cədvəli yoxdur və ya icazə yoxdur:", probeErr.message);
  console.error("   Əvvəl Supabase SQL Editor-də supabase/schema.sql işlədin.");
  process.exit(1);
}

console.log(`📦 ${TOTAL} məhsul əlavə olunur (${BATCH}-lik batch)...`);

let inserted = 0;
for (let start = 1; start <= TOTAL; start += BATCH) {
  const end = Math.min(start + BATCH - 1, TOTAL);
  const rows = [];
  for (let i = start; i <= end; i++) rows.push(productRow(i));

  const { error } = await supabase.from("products").insert(rows);
  if (error) {
    console.error(`❌ Batch ${start}-${end} xətası:`, error.message);
    process.exit(1);
  }
  inserted += rows.length;
  console.log(`   ✓ ${inserted}/${TOTAL}`);
}

const { count } = await supabase
  .from("products")
  .select("*", { count: "exact", head: true });

console.log(`✅ Hazır. products cədvəlində təxminən ${count ?? "?"} sətir var.`);
