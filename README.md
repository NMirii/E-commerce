# GreenShop — Enterprise E-Commerce

Next.js 16, React 19 və Supabase ilə qurulmuş Shopify tipli e-commerce platforması.

## Tələblər

- Node.js 20+
- Supabase hesabı

## Quraşdırma

1. Asılılıqları quraşdırın:

```bash
npm install
```

2. Mühit dəyişənlərini təyin edin:

```bash
cp .env.example .env.local
```

`.env.local` faylında Supabase layihənizin dəyərlərini doldurun:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Supabase SQL Editor-də `supabase/schema.sql` skriptini işlədin.

4. (İstəyə bağlı) Aşağı stok üçün Realtime: Database → Replication → `products` cədvəlini aktiv edin.

5. İnkişaf serverini işə salın:

```bash
npm run dev
```

Brauzerdə [http://localhost:3000](http://localhost:3000) açın.

## Skriptlər

| Əmr | Təsvir |
|-----|--------|
| `npm run dev` | İnkişaf serveri |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |

## Admin girişi

İlk admin istifadəçisi üçün Supabase-də `profiles` cədvəlində `role` sütununu `admin` edin.

## Struktur

- `src/app/(store)` — Mağaza (kataloq, səbət, hesab)
- `src/app/admin` — Admin panel
- `src/app/api` — REST API
- `src/app/actions` — Server Actions
- `src/proxy.ts` — Marşrut qorunması (admin, checkout, account)

Ətraflı tələblər üçün `e-commerce.md` faylına baxın.
