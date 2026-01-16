"use client";

import { CartProvider } from '@/lib/cart-store';
import { Toaster } from 'sonner';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <CartProvider>
      {children}
      <Toaster
        position="bottom-right"
        richColors
        toastOptions={{
          className: 'border border-black/15 bg-white text-[var(--foreground)]',
        }}
      />
    </CartProvider>
  );
};
