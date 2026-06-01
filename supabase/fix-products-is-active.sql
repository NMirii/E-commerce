-- Quick fix if schema.sql failed on products_select_active (is_active missing)
-- Run this alone in SQL Editor, then re-run full schema.sql

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "products_select_active" ON public.products;
CREATE POLICY "products_select_active" ON public.products
  FOR SELECT USING (is_active = true);
