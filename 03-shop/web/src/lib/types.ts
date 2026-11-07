export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
  sales: number;
  createdAt: string;
}

export interface CartItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    stock: number;
    image: string;
    category: string;
  };
  subtotal: number;
}

export interface Address {
  id: number;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: number;
  productId: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNo: string;
  status: string;
  totalPrice: number;
  discountAmount: number;
  payAmount: number;
  address: Address | null;
  createdAt: string;
  items: OrderItem[];
}

export interface Coupon {
  id: number;
  code: string;
  title: string;
  minAmount: number;
  discount: number;
  isUsed: boolean;
}
