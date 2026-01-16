"use client";

import React from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import type { Cart, Product } from './types';
import { PRODUCT_PLACEHOLDERS } from './categories';
import { api } from './api';

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  stock: number;
  category: string;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  ready: boolean;
  stockById: Record<string, number>;
  cartId: string | null;
  resetLocalCart: () => void;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const CartContext = React.createContext<CartContextValue | null>(null);

const CART_ID_KEY = 'schoolshop_cart_id';

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [ready, setReady] = React.useState(false);
  const [cartId, setCartId] = React.useState<string | null>(null);
  const cartIdRef = React.useRef<string | null>(null);
  const initPromiseRef = React.useRef<Promise<void> | null>(null);

  const isMissingCart = React.useCallback((error: unknown) => {
    return (
      error instanceof Error &&
      /cart (expired|not found)/i.test(error.message)
    );
  }, []);

  const mapCartItems = React.useCallback((cart: Cart): CartItem[] => {
    return cart.items.map((item) => {
      const product = item.productId;
      const imageUrl = product.images?.[0] ?? PRODUCT_PLACEHOLDERS.images[0];
      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        imageUrl,
        stock: product.stock,
        category: product.category,
      };
    });
  }, []);

  const showCartError = React.useCallback(
    (message: string, error: unknown) => {
      if (error instanceof Error && error.message) {
        toast.error(message, { description: error.message });
      } else {
        toast.error(message);
      }
    },
    [],
  );

  const setCartIdState = React.useCallback((id: string | null) => {
    cartIdRef.current = id;
    setCartId(id);
    if (id) {
      window.localStorage.setItem(CART_ID_KEY, id);
    } else {
      window.localStorage.removeItem(CART_ID_KEY);
    }
  }, []);

  const resetLocalCart = React.useCallback(() => {
    setItems([]);
    setCartIdState(null);
  }, [setCartIdState]);

  const resetCart = React.useCallback(async () => {
    const cart = await api.createCart();
    setCartIdState(cart._id);
    setItems(mapCartItems(cart));
    return cart._id;
  }, [mapCartItems, setCartIdState]);

  const loadCart = React.useCallback(async () => {
    const storedId = window.localStorage.getItem(CART_ID_KEY);
    if (storedId) {
      try {
        const cart = await api.getCart(storedId);
        setCartIdState(storedId);
        setItems(mapCartItems(cart));
        return;
      } catch (error) {
        if (!isMissingCart(error)) {
          console.warn('Failed to load cart', error);
        }
        window.localStorage.removeItem(CART_ID_KEY);
      }
    }

    try {
      await resetCart();
    } catch (error) {
      console.warn('Failed to create cart', error);
      setCartIdState(null);
      setItems([]);
    }
  }, [isMissingCart, mapCartItems, resetCart, setCartIdState]);

  const ensureCartId = React.useCallback(async () => {
    if (!ready && initPromiseRef.current) {
      await initPromiseRef.current;
    }
    if (cartIdRef.current) {
      return cartIdRef.current;
    }
    return resetCart();
  }, [ready, resetCart]);

  React.useEffect(() => {
    let active = true;
    const init = async () => {
      await loadCart();
      if (active) {
        setReady(true);
      }
    };

    const initPromise = init();
    initPromiseRef.current = initPromise;

    return () => {
      active = false;
    };
  }, [loadCart]);

  const addItem = React.useCallback(
    (product: Product, quantity = 1) => {
      void (async () => {
        try {
          const id = await ensureCartId();
          const cart = await api.addCartItem(id, {
            productId: product._id,
            quantity,
          });
          setItems(mapCartItems(cart));
          toast.success('Added to cart :3', {
            description: product.name,
          });
          confetti({
            particleCount: 70,
            spread: 70,
            origin: { y: 0.7 },
          });
        } catch (error) {
          if (isMissingCart(error)) {
            try {
              const id = await resetCart();
              const cart = await api.addCartItem(id, {
                productId: product._id,
                quantity,
              });
              setItems(mapCartItems(cart));
              toast.success('Added to cart :3', {
                description: product.name,
              });
              confetti({
                particleCount: 70,
                spread: 70,
                origin: { y: 0.7 },
              });
              return;
            } catch (retryError) {
              console.warn('Failed to add item after reset', retryError);
              showCartError('Could not add to cart.', retryError);
            }
          }
          console.warn('Failed to add item', error);
          showCartError('Could not add to cart.', error);
        }
      })();
    },
    [ensureCartId, isMissingCart, mapCartItems, resetCart, showCartError],
  );

  const updateQuantity = React.useCallback((productId: string, quantity: number) => {
    void (async () => {
      try {
        const id = await ensureCartId();
        const cart =
          quantity < 1
            ? await api.removeCartItem(id, productId)
            : await api.updateCartItem(id, productId, { quantity });
        setItems(mapCartItems(cart));
      } catch (error) {
        if (isMissingCart(error)) {
          await resetCart();
          return;
        }
        console.warn('Failed to update item', error);
        showCartError('Could not update the cart.', error);
      }
    })();
  }, [ensureCartId, isMissingCart, mapCartItems, resetCart, showCartError]);

  const removeItem = React.useCallback((productId: string) => {
    void (async () => {
      try {
        const id = await ensureCartId();
        const cart = await api.removeCartItem(id, productId);
        setItems(mapCartItems(cart));
      } catch (error) {
        if (isMissingCart(error)) {
          await resetCart();
          return;
        }
        console.warn('Failed to remove item', error);
        showCartError('Could not remove the item.', error);
      }
    })();
  }, [ensureCartId, isMissingCart, mapCartItems, resetCart, showCartError]);

  const clear = React.useCallback(() => {
    void (async () => {
      try {
        const id = await ensureCartId();
        await api.clearCart(id);
        await resetCart();
      } catch (error) {
        if (isMissingCart(error)) {
          await resetCart();
          return;
        }
        console.warn('Failed to clear cart', error);
        showCartError('Could not clear the cart.', error);
        setItems([]);
        setCartIdState(null);
      }
    })();
  }, [
    ensureCartId,
    isMissingCart,
    resetCart,
    setCartIdState,
    showCartError,
  ]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const stockById = React.useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      acc[item.productId] = item.stock;
      return acc;
    }, {});
  }, [items]);

  const value = React.useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      ready,
      stockById,
      cartId,
      resetLocalCart,
      addItem,
      updateQuantity,
      removeItem,
      clear,
    }),
    [
      items,
      itemCount,
      subtotal,
      ready,
      stockById,
      cartId,
      resetLocalCart,
      addItem,
      updateQuantity,
      removeItem,
      clear,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
