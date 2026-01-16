export type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
};

export type Order = {
  _id: string;
  items: OrderItem[];
  total: number;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
};

export type CartLineItem = {
  productId: Product;
  quantity: number;
};

export type Cart = {
  _id: string;
  items: CartLineItem[];
  expiresAt: string;
};
