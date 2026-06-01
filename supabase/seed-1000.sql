-- 1000 nümunə məhsul (əvvəl schema.sql işlədilməlidir)
-- Supabase → SQL Editor → Run

INSERT INTO public.products (
  title,
  description,
  price,
  category,
  inventory_count,
  image_url,
  is_active
)
SELECT
  'Məhsul #' || i::text,
  'GreenShop kataloqu — məhsul nömrəsi ' || i::text,
  round((random() * 95 + 5)::numeric, 2),
  (ARRAY['Meyvə', 'Çay', 'Qida', 'Kosmetika', 'Ümumi', 'Tərəvəz', 'Ətir'])[
    1 + floor(random() * 7)::int
  ],
  1 + floor(random() * 250)::int,
  'https://picsum.photos/seed/greenshop' || i::text || '/400/400',
  true
FROM generate_series(1, 1000) AS i;
