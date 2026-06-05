# Supabase — tam quraşdırma təlimatı (GreenShop)

Bu sənəd **yalnız Supabase tərəfini** izah edir. Kod `E-commerce-main` qovluğundadır.

---

## Supabase nədir? (1 dəqiqəlik məntiq)

| Hissə | Nədir |
|-------|--------|
| **Supabase** | Buludda PostgreSQL + giriş (Auth) |
| **Dashboard** | Brauzerdə idarə paneli (supabase.com) |
| **schema.sql** | Cədvəllər və təhlükəsizlik qaydaları |
| **seed-1000.sql** | 1000 nümunə məhsul |
| **.env.local** | Saytın Supabase-ə qoşulma açarı |

Sayt (localhost:3000) ↔ `.env.local` ↔ Supabase layihəsi

---

## ADDIM 1 — Layihəni açın və düzgün layihədə olduğunuzu yoxlayın

1. Brauzerdə açın: **https://supabase.com/dashboard**
2. Daxil olun (Google / GitHub / email).
3. Layihə siyahısından **öz layihənizi** seçin.

**Vacib:** URL-də layihə ID görünür, məsələn:

`https://supabase.com/dashboard/project/zrcwutfhpqajzyzbgndk`

Sizin `.env.local`-dəki URL də eyni ID ilə bitməlidir:

`https://zrcwutfhpqajzyzbgndk.supabase.co`

Əgər dashboard-da **başqa** layihə açıbsınızsa, SQL və məhsullar **o başqa layihədə** qalar — sayt boş görünər.

---

## ADDIM 2 — API açarları (Settings → API)

Sol aşağı: **Project Settings** (dişli) → **API**

### 2.1 Project URL

Səhifənin yuxarısında və ya **General** bölməsində:

- **Project URL** = `https://XXXX.supabase.co`
- Bunu kopyalayın → `.env.local` → `NEXT_PUBLIC_SUPABASE_URL=`

### 2.2 Publishable key (yeni interfeys)

Tab: **Publishable and secret API keys**

- **Publishable key** (`sb_publishable_...`) → **Copy**
- `.env.local` → `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`  
  (ad `ANON_KEY` qalsa da, publishable dəyər işləyir)

### 2.3 Secret key — sayta qoymayın

`sb_secret_...` — yalnız server / SQL / etibarlı skriptlər üçün.  
**Heç vaxt** `NEXT_PUBLIC_` ilə yazmayın.

### 2.4 Legacy tab (istəyə bağlı)

**Legacy anon, service_role API keys** tabında köhnə `eyJhbGci...` anon açarı var — o da `NEXT_PUBLIC_SUPABASE_ANON_KEY`-ə yazıla bilər.

### 2.5 `.env.local` nümunəsi

Fayl yolu (dəqiq):

`C:\Users\Miri\Downloads\E-commerce-main\E-commerce-main\.env.local`

Məzmun (öz dəyərlərinizlə):

```env
NEXT_PUBLIC_SUPABASE_URL=https://zrcwutfhpqajzyzbgndk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_SIZIN_ACARINIZ
```

- Boşluq, dırnaq (`"`) olmasın.
- Hər dəyişən ayrı sətirdə.
- Saxladıqdan sonra terminalda: **Ctrl+C** → `npm run dev` (yenidən).

---

## ADDIM 3 — Verilənlər bazası (SQL Editor) — ƏN VACİB ADDIM

Bu addımı etməsəniz **məhsul olmayacaq**.

### 3.1 SQL Editor haradadır?

Sol menyu → **SQL Editor** → **New query**

### 3.2 schema.sql necə işlədilir?

1. Kompüterdə açın: `E-commerce-main\supabase\schema.sql`
2. **Ctrl+A** (hamısı) → **Ctrl+C**
3. Supabase SQL Editor-ə **Ctrl+V**
4. Sağ altda **Run** (və ya Ctrl+Enter)
5. Aşağıda **Success** / yaşıl mesaj gözləyin

### 3.3 Uğurlu oldunu yoxlayın

Sol menyu → **Table Editor**

Bu cədvəllər görünməlidir:

- profiles
- products
- orders
- order_items
- cart_items
- audit_logs

**products yoxdursa** — schema tam işləməyib; Addım 3.2-ni təkrar edin.

### 3.4 Əgər `is_active does not exist` xətası çıxıbsa

1. Əvvəl `fix-products-is-active.sql` işlədin (SQL Editor)
2. Sonra yenidən tam `schema.sql` işlədin

### 3.5 1000 məhsul əlavə etmək

1. `seed-1000.sql` açın → hamısını kopyalayın
2. SQL Editor → yapışdır → **Run**
3. **Table Editor** → **products** → çox sətir (1000) olmalıdır

---

## ADDIM 4 — Authentication (qeydiyyat / giriş)

Sol menyu → **Authentication** → **Providers** → **Email** aktiv olsun.

### Email təsdiqi (tez-tez problem)

**Authentication** → **Sign In / Providers** / **Email** bölməsində:

- İnkişaf üçün: **Confirm email** = **OFF** (söndürün)  
  → qeydiyyatdan dərhal giriş olur
- Əks halda: **Email not confirmed** xətası alarsınız

### İlk istifadəçi

- Saytda **Register**, və ya
- Dashboard → **Authentication** → **Users** → **Add user**

Qeydiyyatdan sonra **Table Editor** → **profiles** — yeni sətir avtomatik yaranmalıdır (trigger).

---

## ADDIM 5 — Admin panel

1. **Table Editor** → **profiles**
2. Öz emailinizin sətirini tapın
3. **role** sütununu `customer` → **`admin`** edin
4. Save

Sonra saytda `/admin` işləyir.

---

## ADDIM 6 — Saytı yoxlayın

1. Terminal: `cd E-commerce-main` (içində `package.json` olan qovluq)
2. `npm run dev`
3. Brauzer: http://localhost:3000
4. Məhsullar görünməlidir

Əgər **Supabase quraşdırılmayıb** yazısı varsa → `.env.local` yoxlayın, serveri yenidən başladın.

Əgər **Məhsul tapılmadı** yazısı varsa → `products` cədvəli boşdur → `seed-1000.sql` işlədin.

---

## Tez-tez xətalar

| Simptom | Səbəb | Həll |
|---------|--------|------|
| Supabase quraşdırılmayıb | `.env.local` boş/yanlış | URL + publishable key, `npm run dev` restart |
| Məhsul tapılmadı | `products` boş | `seed-1000.sql` Run |
| Table not found | schema işləməyib | `schema.sql` Run, düzgün layihə |
| Email not confirmed | təsdiq açıqdır | Auth-da Confirm email OFF |
| is_active xətası | köhnə cədvəl | `fix-products-is-active.sql` + `schema.sql` |
| Policy already exists | təkrar Run | yenilənmiş `schema.sql` (DROP POLICY var) |

---

## Fayl sırası (xatırlatma)

```
1. schema.sql          ← cədvəllər (mütləq)
2. seed-1000.sql       ← məhsullar (istəyə bağlı, 1000 ədəd)
3. .env.local          ← açarlar (sayt üçün)
4. npm run dev         ← sayt
```

---

## Kömək üçün yoxlama siyahısı

- [ ] Dashboard layihə ID = `.env.local` URL-dəki ID
- [ ] `.env.local` 2 sətir dolu
- [ ] Table Editor-də `products` var
- [ ] `products`-da sətirlər var (seed sonrası)
- [ ] `npm run dev` `E-commerce-main` içindən
- [ ] Auth Confirm email OFF (lokal test)
