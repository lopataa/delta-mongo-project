"use client";

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/lib/cart-store';

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, ready, cartId } =
    useCart();
  const [form, setForm] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    if (!cartId) {
      setError('Cart is still loading. Try again in a moment.');
      return;
    }

    try {
      setStatus('loading');
      setError(null);
      const successUrl = `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/cancel`;
      const session = await api.createCheckoutSession({
        cartId,
        successUrl,
        cancelUrl,
        customerEmail: form.email,
        customerName: form.customerName,
        phone: form.phone,
        address: form.address,
      });
      toast.success('Redirecting to Stripe checkout...', {
        description: 'Hang tight while we open the secure payment page.',
      });
      window.location.href = session.url;
    } catch (err) {
      setStatus('error');
      setError(
        err instanceof Error ? err.message : 'Checkout failed to start',
      );
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 pb-16 pt-10">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl">your cart :3</h1>
          <Button asChild variant="outline" className="border-black/40">
            <Link href="/">Continue shopping</Link>
          </Button>
        </div>

        {!ready ? (
          <div className="rounded-2xl border border-black/10 bg-[var(--card)] p-8 text-sm text-[var(--muted)]">
            Loading your cart...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-[var(--card)] p-8 text-sm text-[var(--muted)]">
            Your cart is empty. Add some cat goodies.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-3xl border border-black/10 bg-[var(--card)] p-6 shadow-brutal">
              <div className="flex flex-col gap-5">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex flex-col gap-4 border-b border-black/10 pb-4 last:border-none last:pb-0 md:flex-row md:items-center"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-24 w-24 rounded-xl border border-black/10 object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-display text-lg">{item.name}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {item.category}
                      </p>
                      <p className="text-sm font-semibold">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 w-9 border-black/30 px-0"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                      >
                        -
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 w-9 border-black/30 px-0"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-sm text-[var(--muted)]"
                      onClick={() => removeItem(item.productId)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-black/10 bg-[var(--card)] p-6 shadow-brutal">
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div>
                  <h2 className="font-display text-xl">checkout :3</h2>
                  <p className="text-sm text-[var(--muted)]">
                    Total: {formatPrice(subtotal)}
                  </p>
                </div>
                <Input
                  required
                  value={form.customerName}
                  onChange={(event) =>
                    setForm({ ...form, customerName: event.target.value })
                  }
                  placeholder="Full name"
                  className="border-black/20"
                />
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  placeholder="Email for your receipt"
                  className="border-black/20"
                />
                <Input
                  required
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                  placeholder="Phone"
                  className="border-black/20"
                />
                <Textarea
                  required
                  value={form.address}
                  onChange={(event) =>
                    setForm({ ...form, address: event.target.value })
                  }
                  placeholder="Delivery address"
                  className="min-h-[100px] border-black/20"
                />
                <div className="rounded-xl border border-black/10 bg-white p-3 text-xs text-[var(--muted)]">
                  You'll finish the payment on Stripe's secure checkout page.
                </div>
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="bg-[var(--foreground)] text-[var(--background)]"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Starting...' : 'Checkout with Stripe'}
                </Button>
              </form>
            </section>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
