-- Nümunə məhsullar (əvvəl schema.sql işlədin)
-- Supabase → SQL Editor → yapışdırın → Run

INSERT INTO public.products (title, description, price, category, inventory_count, image_url, is_active)
VALUES
  (
    'Orqanik Alma',
    'Təzə, şirəli almalar — 1 kq',
    4.50,
    'Meyvə',
    120,
    'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop',
    true
  ),
  (
    'Yaşıl Çay',
    'Premium yarpaqlı çay — 100q',
    12.90,
    'Çay',
    80,
    'https://images.unsplash.com/photo-1556881286-2ed7f2b1f6cd?w=400&h=400&fit=crop',
    true
  ),
  (
    'Təbii Bal',
    'Çiçək balı — 500q',
    18.00,
    'Qida',
    45,
    'https://images.unsplash.com/photo-1587049352846-4a03e6fe9f7b?w=400&h=400&fit=crop',
    true
  ),
  (
    'Badam',
    'Qızardılmış badam — 250q',
    9.75,
    'Qida',
    60,
    'https://images.unsplash.com/photo-1508747703725-719777637510?w=400&h=400&fit=crop',
    true
  ),
  (
    'Aloe Vera Gel',
    'Dəri üçün təbii gel — 200ml',
    14.50,
    'Kosmetika',
    30,
    'https://images.unsplash.com/photo-1629198688000-2f140a705f69?w=400&h=400&fit=crop',
    true
  )
;
