import { clearAdminToken, getAdminToken } from './admin-auth';
import { Cart, Order, OrderItem, Product } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5050/api';

const extractErrorMessage = async (res: Response) => {
  const text = await res.text();
  if (!text) {
    return 'Request failed';
  }
  try {
    const data = JSON.parse(text) as { message?: string | string[] };
    if (data?.message) {
      return Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message;
    }
  } catch {
    // fall through to raw text
  }
  return text;
};

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    const message = await extractErrorMessage(res);
    throw new Error(message);
  }

  return res.json() as Promise<T>;
};

const adminRequest = async <T>(path: string, options?: RequestInit) => {
  const token = getAdminToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
      'x-admin-token': token ?? '',
    },
    ...options,
  });

  if (res.status === 401) {
    clearAdminToken();
  }

  if (!res.ok) {
    const message = await extractErrorMessage(res);
    throw new Error(message);
  }

  return res.json() as Promise<T>;
};

export const api = {
  getProducts: (params?: { category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) {
      query.set('category', params.category);
    }
    if (params?.search) {
      query.set('search', params.search);
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<Product[]>(`/products${suffix}`);
  },
  getProduct: (id: string) => request<Product>(`/products/${id}`),
  createProduct: (payload: Omit<Product, '_id'>) =>
    adminRequest<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateProduct: (id: string, payload: Partial<Omit<Product, '_id'>>) =>
    adminRequest<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id: string) =>
    adminRequest<{ deleted: boolean }>(`/products/${id}`, {
      method: 'DELETE',
    }),
  createOrder: (payload: {
    items: OrderItem[];
    customerName: string;
    email: string;
    phone: string;
    address: string;
  }) =>
    request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getOrders: () => adminRequest<Order[]>('/orders'),
  adminLogin: (password: string) =>
    request<{ token: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  presignUploads: (files: { filename: string; contentType?: string }[]) =>
    adminRequest<{ uploads: { uploadUrl: string; fileUrl: string }[] }>(
      '/uploads/presign',
      {
        method: 'POST',
        body: JSON.stringify({ files }),
      },
    ),
  createCart: () =>
    request<Cart>('/carts', {
      method: 'POST',
    }),
  getCart: (id: string) => request<Cart>(`/carts/${id}`),
  addCartItem: (
    cartId: string,
    payload: { productId: string; quantity: number },
  ) =>
    request<Cart>(`/carts/${cartId}/items`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateCartItem: (
    cartId: string,
    productId: string,
    payload: { quantity: number },
  ) =>
    request<Cart>(`/carts/${cartId}/items/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  removeCartItem: (cartId: string, productId: string) =>
    request<Cart>(`/carts/${cartId}/items/${productId}`, {
      method: 'DELETE',
    }),
  clearCart: (cartId: string) =>
    request<{ deleted: boolean }>(`/carts/${cartId}`, {
      method: 'DELETE',
    }),
  createCheckoutSession: (payload: {
    cartId: string;
    successUrl?: string;
    cancelUrl?: string;
    customerEmail?: string;
    customerName?: string;
    phone?: string;
    address?: string;
  }) =>
    request<{ url: string; id: string }>('/checkout/session', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  completeCheckoutSession: (payload: { sessionId: string }) =>
    request<{ orderId: string; status: string }>('/checkout/complete', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
