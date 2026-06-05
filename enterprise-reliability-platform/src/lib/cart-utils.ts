export type CartProduct = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
};

export type CartLine = {
  id: string;
  quantity: number;
  products: CartProduct | CartProduct[] | null;
};

export function resolveCartProduct(
  products: CartLine["products"]
): CartProduct | null {
  if (!products) return null;
  return Array.isArray(products) ? (products[0] ?? null) : products;
}

/** Supabase joins may return a single row or an array depending on relation metadata. */
export function resolveNested<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
