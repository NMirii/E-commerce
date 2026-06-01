export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  inventory_count: number;
  is_active?: boolean;
}

export interface OrderSummary {
  id: string;
  total: number;
  status: string;
  shipping_address?: string;
  created_at?: string;
}

export interface CartItemView {
  id: string;
  quantity: number;
  products: {
    id: string;
    title: string;
    price: number;
    image_url: string | null;
  } | null;
}

export interface ProfileSnippet {
  full_name: string | null;
  email: string;
}
