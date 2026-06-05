# Enterprise E-commerce Platform Architecture & Implementation Guide (Shopify-style)

This document extracts all requirements related to the **E-commerce Platform** from the Enterprise Backend Integration Platform instructions and provides a comprehensive, production-ready blueprint for implementing it using the **Next.js 16 App Router**, **React 19**, and **Supabase (PostgreSQL)**.

---

## 1. Domain Overview & Requirements Extraction

### 1.1 Core Platform Definition
*   **Domain**: E-commerce Platform (Shopify-style)
*   **Core Focus**: Manage inventory, order workflows, checkout pipelines, product catalogs, and recommendation feeds.
*   **Security Focus**: Customer data protection, secure checkout, fraud prevention, and audit trails for inventory mutations.
*   **Key Next.js 16 / React 19 Patterns**: Async Request APIs (async `params`, `cookies()`, `headers()`), Next.js 16 `proxy.ts` routing, React 19 Server Actions (`useActionState`), and advanced caching (`updateTag`, `revalidateTag`).

### 1.2 Extracted Requirements Checklist
Here are the specific deliverables and technical steps tailored to the E-commerce platform:

*   **Step 1: Enterprise Data Fetching (Dashboard)**
    *   [ ] Primary Entity Catalog (Products & Inventory) with real-time updates and secure fetching.
    *   [ ] Management Interface with filtering, sorting, and search (by category, price, stock).
    *   [ ] Analytics Dashboard showing total sales, order counts, and stock alerts.
    *   [ ] Caching & Revalidation using SWR with secure cache invalidation.
    *   [ ] Activity History (Order logs & inventory audits) with infinite scrolling and optimistic UI updates.
    *   [ ] Real-time notifications and alerts (e.g., low stock warning) via Supabase Realtime.

*   **Step 2: Secure API Infrastructure (`src/app/api`)**
    *   [ ] `GET /api/products` - Securely fetch products with pagination, search, and category filters.
    *   [ ] `POST /api/products` - Admin/Manager only route to create products with Zod validation.
    *   [ ] `GET /api/products/[id]` - Detailed product view.
    *   [ ] `PUT /api/products/[id]` - Admin/Manager only route to update product & inventory.
    *   [ ] `DELETE /api/products/[id]` - Admin/Manager only route to soft-delete/remove product.
    *   [ ] `GET /api/orders` - List user orders (or all orders for Admins) with status filtering.
    *   [ ] `POST /api/orders` - Secure checkout API with stock availability checks and race condition prevention.
    *   [ ] `PUT /api/orders/[id]` - Admin/Manager only endpoint to transition order states (`pending` -> `processing` -> `shipped` -> `delivered`).
    *   [ ] `GET /api/inventory` - Dedicated inventory monitoring endpoint with low-stock flagging.
    *   [ ] Webhook Endpoint (`/api/webhooks/payment`) - Simulate external payment gateway updates (Stripe-style) to process inventory reductions.

*   **Step 3: Secure Server Actions (`src/app/actions`)**
    *   [ ] Product Management Server Action (`src/app/actions/products.ts`) - Create and edit products with Zod validation, security checking, and database audit logs.
    *   [ ] Order Mutation Server Action (`src/app/actions/orders.ts`) - Place orders, update order status, and log inventory changes.
    *   [ ] Enhanced Form Component (`src/components/ProductForm.tsx`) - Client-side validation, server-action bindings, loading indicators, and optimistic updates.
    *   [ ] Progressive Enhancement - Forms must remain functional without JavaScript.

*   **Step 4: Enterprise Authentication & Route Protection**
    *   [ ] Auth Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
    *   [ ] Authentication Context (`src/contexts/AuthContext.tsx`) - Track user profiles, sessions, and roles (`admin`, `manager`, `customer`).
    *   [ ] Next.js 16 Route Protection - Protect `/admin/*`, `/account/*`, and `/checkout/*` via `proxy.ts`.

*   **Step 5: Platform Integration & Performance Optimization**
    *   [ ] A cohesive, modern Admin Dashboard layout featuring a premium glassmorphic/dark-mode aesthetic.
    *   [ ] Database transaction safety (prevent double-purchases or negative inventory).
    *   [ ] Next.js 16 caching strategies (`updateTag` for immediate reads, `revalidateTag` for general catalogs).

---

## 2. Database Schema (Supabase / PostgreSQL)

To back our enterprise features, we will create the following tables. Since Supabase is already configured, these tables can be created directly in the Supabase SQL editor:

```sql
-- 1. PROFILES Table (Extends Supabase Auth users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'manager', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access to profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile when auth.users is populated
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Customer'),
    COALESCE(new.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. PRODUCTS Table
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  category TEXT NOT NULL,
  inventory_count INTEGER NOT NULL DEFAULT 0 CHECK (inventory_count >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins and Managers can modify products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
    )
  );


-- 3. ORDERS Table
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and Managers can view all orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and Managers can update order status" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
    )
  );


-- 4. ORDER ITEMS Table
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and Managers can view all order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
    )
  );


-- 5. AUDIT LOGS Table (Compliance & Fraud tracking)
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- e.g., 'PRODUCT_MUTATION', 'ORDER_STATUS_CHANGE', 'INVENTORY_ADJUST'
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
```

---

## 3. Step-by-Step Implementation Guide

### Step 1: Enterprise Data Fetching (Products, Inventory, & Analytics)

#### Data Fetching Architecture (Client-Side SWR)
We use the SWR library (or a custom wrapper) to fetch dashboard data. SWR provides caching, automatic revalidation when the tab is focused, and options for optimistic UI updates.
*   Install SWR: `npm install swr`
*   Create a custom fetcher that uses native fetch and injects auth headers from our session context.

#### Handling Race Conditions and Caching
*   **Race Conditions**: SWR automatically discards out-of-order responses using internal keys and request timestamps.
*   **Sensitive Data Caching**: For sensitive dashboard metrics, set `revalidateOnFocus` to `true` and configure the browser cache lifetimes securely. Avoid caching credit cards or PII on client storage.

#### Optimistic UI Updates Example
When updating product inventory in the catalog, immediately update the client-side state of SWR before making the PUT request:
```typescript
import useSWR, { mutate } from 'swr';

const { data: products } = useSWR('/api/products');

const updateStockOptimistically = async (productId: string, newStock: number) => {
  const endpoint = `/api/products/${productId}`;
  
  // 1. Optimistic Update (Client state updated instantly)
  const updatedProducts = products?.map(p => 
    p.id === productId ? { ...p, inventory_count: newStock } : p
  );
  
  mutate('/api/products', updatedProducts, false); // False avoids immediate revalidation
  
  try {
    // 2. Real API Request
    await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventory_count: newStock })
    });
    
    // 3. Trigger Revalidation to sync with the exact DB state
    mutate('/api/products');
  } catch (error) {
    // Rollback if failed
    mutate('/api/products', products);
  }
};
```

---

### Step 2: Secure API Infrastructure (`src/app/api/*`)

All API routes must use **Zod** for validation, check authentication, perform role-based authorization, and return precise HTTP status codes.

#### Next.js 16 Async Request API Requirements
> [!IMPORTANT]
> Next.js 16 completely removes synchronous dynamic APIs. The `cookies()`, `headers()`, and route parameters (`params`) are now strictly Promises. They must be awaited.

**Example Route Handler (`src/app/api/products/[id]/route.ts`):**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateProductSchema = z.object({
  title: z.string().min(3).optional(),
  price: z.number().positive().optional(),
  inventory_count: z.number().int().nonnegative().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // Await the route parameters (Next.js 16 requirement)
    const { id } = await context.params;

    // Await database client initialization
    const supabase = await createClient();

    // Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role-based authorization
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Input Validation
    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    // Database Mutation
    const { data: product, error } = await supabase
      .from('products')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Audit Logging
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action_type: 'PRODUCT_MUTATION',
      details: { product_id: id, changes: validatedData }
    });

    return NextResponse.json(product);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
```

---

### Step 3: Secure Server Actions & Progressive Enhancement

Server Actions handle form submissions without routing through REST endpoints. In Next.js 16 and React 19, they integrate cleanly with `useActionState` for handling loading and error states.

#### Phase 1: Server Action (`src/app/actions/products.ts`)
```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { updateTag } from 'next/cache';

const productSchema = z.object({
  title: z.string().min(2, "Title is too short"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  inventory_count: z.coerce.number().int().nonnegative("Inventory cannot be negative"),
  category: z.string().min(1, "Category is required"),
});

export async function createProductAction(prevState: any, formData: FormData) {
  try {
    const supabase = await createClient();
    
    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Validate incoming data
    const rawData = {
      title: formData.get('title'),
      description: formData.get('description'),
      price: formData.get('price'),
      inventory_count: formData.get('inventory_count'),
      category: formData.get('category'),
    };
    
    const validated = productSchema.parse(rawData);

    // Save to Database
    const { data, error } = await supabase
      .from('products')
      .insert(validated)
      .select()
      .single();

    if (error) throw error;

    // Purge Caches instantly using Next.js 16 read-your-writes semantics
    updateTag('products-catalog');

    return { success: true, data, error: null };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors[0].message };
    }
    return { success: false, error: err.message || 'Failed to create product' };
  }
}
```

#### Phase 2: React 19 Form Component (`src/components/ProductForm.tsx`)
In React 19 / Next.js 16, we use `useActionState` instead of the deprecated `useFormState`.

```tsx
'use client';

import { useActionState } from 'react';
import { createProductAction } from '@/app/actions/products';

const initialState = {
  success: false,
  data: null,
  error: null,
};

export default function ProductForm() {
  // useActionState handles pending state automatically
  const [state, formAction, isPending] = useActionState(createProductAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 p-6 bg-zinc-900 rounded-xl max-w-md border border-zinc-800">
      <h2 className="text-xl font-bold text-white mb-2">Add New Product</h2>
      
      {state.error && (
        <div className="p-3 bg-red-950/50 border border-red-800 text-red-400 rounded text-sm">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="p-3 bg-green-950/50 border border-green-800 text-green-400 rounded text-sm">
          Product created successfully!
        </div>
      )}

      <div>
        <label className="block text-zinc-400 text-xs font-semibold mb-1">Title</label>
        <input 
          type="text" 
          name="title" 
          required 
          disabled={isPending}
          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500" 
        />
      </div>

      <div>
        <label className="block text-zinc-400 text-xs font-semibold mb-1">Category</label>
        <input 
          type="text" 
          name="category" 
          required 
          disabled={isPending}
          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500" 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-zinc-400 text-xs font-semibold mb-1">Price ($)</label>
          <input 
            type="number" 
            step="0.01" 
            name="price" 
            required 
            disabled={isPending}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500" 
          />
        </div>
        <div>
          <label className="block text-zinc-400 text-xs font-semibold mb-1">Stock Count</label>
          <input 
            type="number" 
            name="inventory_count" 
            required 
            disabled={isPending}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500" 
          />
        </div>
      </div>

      <div>
        <label className="block text-zinc-400 text-xs font-semibold mb-1">Description</label>
        <textarea 
          name="description" 
          rows={3} 
          disabled={isPending}
          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded transition-colors disabled:bg-indigo-800 disabled:text-zinc-400"
      >
        {isPending ? 'Saving...' : 'Create Product'}
      </button>
    </form>
  );
}
```

---

### Step 4: Enterprise Authentication & Route Protection

#### 4.1 Supabase SSR Authentication Flow
Auth is implemented using cookies stored securely in the browser. In server-side components and Route Handlers, the token is parsed from request headers.

#### 4.2 Next.js 16 Route Protection (`src/proxy.ts`)
> [!WARNING]
> Next.js 16 deprecates the name `middleware.ts` in favor of `proxy.ts`. The exported function must be renamed from `middleware` to `proxy`. The runtime must be Node.js (Edge runtime is no longer supported in `proxy.ts` files).

Create `src/proxy.ts` at the same level as the `app` folder:
```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Init Supabase SSR client with cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Authenticate user session
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Admin/Manager Route Protection
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "manager"].bind(null).name && !["admin", "manager"].includes(profile.role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 2. Checkout / Account Protection
  if (request.nextUrl.pathname.startsWith("/checkout") || request.nextUrl.pathname.startsWith("/account")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return supabaseResponse;
}

// Routes to run proxy on (Next.js 16 optimization matchers)
export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*"],
};
```

---

### Step 5: Integration & Dashboard Layout

Create a stunning, glassmorphic layout inside `src/app/admin/layout.tsx`.
*   Include Sidebar navigation.
*   Integrate the Auth context to present logout and profile updates.
*   Present statistics (KPI Cards with Sparklines) and listing sheets.

#### Premium UI Design Principles
*   Use harmonious palettes: Dark slate backgrounds (`zinc-950`), glowing accents (`indigo-500` or `emerald-500`).
*   Enable transitions (`transition-all duration-300`) on interactive states.
*   Avoid placeholders. Use the `generate_image` tool for mock banners or real-world product mockups.

---

## 4. Next.js 16 Migration Reference

When implementing, watch out for the following critical Next.js 16 updates. Adhering to these is mandatory for passing build lint checks:

| Deprecated Feature | Next.js 16 Replacement | Notes |
| :--- | :--- | :--- |
| `middleware.ts` | `proxy.ts` | The file must be renamed; runtime defaults to Node.js. |
| `export function middleware` | `export function proxy` | Named export inside `proxy.ts` must change. |
| Synchronous `params` in layout/page | `await params` (Promise) | Accessing props synchronously will cause fatal runtime errors. |
| Synchronous `cookies()` / `headers()` | `await cookies()` / `await headers()` | Standard functions are now Promises. |
| `revalidateTag(tag)` | `revalidateTag(tag, 'max')` | The single-argument signature is deprecated. |
| `useFormState` (React) | `useActionState` (React 19) | Native React Hook replacement. |
| Image `priority` prop | `preload` prop | `<Image src="..." preload />` rather than `priority`. |

---

## 5. Development Strategy (How to proceed)

1.  **Run migrations** in Supabase to initialize the tables (`profiles`, `products`, `orders`, `order_items`, `audit_logs`).
2.  **Rename `middleware.ts` to `src/proxy.ts`** and update the function name to `proxy` to conform to Next.js 16.
3.  **Implement the Auth Context & Screens**: Build user registration and login endpoints utilizing the Supabase client.
4.  **Create the Catalog & Forms**: Set up Zod schemas and Server Actions to modify product records.
5.  **Build the Admin Dashboard**: Construct SWR fetching with optimistic updates for inventory adjusting.
6.  **Verify**: Validate performance using `npm run build` to ensure no async parameters are accessed synchronously.
