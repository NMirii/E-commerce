# JWT Authentication (custom)

Supabase Auth əvəzinə platforma **öz JWT** sistemi ilə işləyir.

## Quraşdırma

### 1. `.env.local`

```env
JWT_SECRET=<ən_az_32_simvol_təsadüfi_sətir>
SUPABASE_SERVICE_ROLE_KEY=<sb_secret_... və ya service_role>
```

- `JWT_SECRET` — serverdə qalmalı, heç vaxt `NEXT_PUBLIC_` deyil
- `SUPABASE_SERVICE_ROLE_KEY` — Dashboard → Settings → API → **Secret key**

### 2. SQL migration

SQL Editor-də işlədin: `supabase/auth-jwt-migration.sql`

### 3. Yeni qeydiyyat

Köhnə Supabase Auth istifadəçilərinin `password_hash` yoxdur — **yenidən qeydiyyat** və ya admin SQL ilə hash əlavə edin.

## API

| Method | Path | Təsvir |
|--------|------|--------|
| POST | `/api/auth/register` | Qeydiyyat + JWT cookie |
| POST | `/api/auth/login` | Giriş + JWT cookie |
| POST | `/api/auth/logout` | Cookie silinir |
| GET | `/api/auth/me` | Cari sessiya |

Cookie: `greenshop_access_token` (httpOnly, 7 gün)

## Təhlükəsizlik

- Şifrələr: **bcrypt** (12 round)
- Token: **HS256** (`jose`)
- Marşrut qorunması: `src/proxy.ts` + API `requireApiSession` / `requireApiRole`
