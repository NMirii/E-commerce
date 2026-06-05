-- JWT auth migration (custom auth, Supabase Auth-dan asılı deyil)
-- SQL Editor-də schema.sql-dən SONRA işlədin

-- Profillər müstəqil istifadəçi cədvəli olsun
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Köhnə Supabase Auth trigger-i söndür (JWT qeydiyyatı profiles-ə birbaşa yazır)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Email unikal olsun
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_lower
  ON public.profiles (lower(email));

COMMENT ON COLUMN public.profiles.password_hash IS 'bcrypt hash; JWT login üçün';
