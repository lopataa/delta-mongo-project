'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useCart } from '@/lib/cart-store';

const SUCCESS_GIF =
  'https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif';

export function SuccessContent() {
  const searchParams = useSearchParams();
  const { resetLocalCart } = useCart();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [message, setMessage] = useState<string | null>(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    let active = true;
    if (!sessionId) {
      setStatus('error');
      setMessage('Missing checkout session. Please return to your cart.');
      return;
    }

    const finalize = async () => {
      try {
        await api.completeCheckoutSession({ sessionId });
        if (!active) return;
        resetLocalCart();
        setStatus('success');
      } catch (error) {
        if (!active) return;
        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : 'Unable to confirm the order yet.',
        );
      }
    };

    void finalize();
    return () => {
      active = false;
    };
  }, [resetLocalCart, sessionId]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 pb-16 pt-12">
      <section className="relative overflow-hidden rounded-3xl border border-black/10 bg-[var(--card)] p-8 shadow-brutal">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[var(--accent)]/60 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-36 w-36 -translate-x-10 translate-y-6 rounded-full bg-[var(--accent-strong)]/40 blur-2xl" />
        <div className="relative grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="flex flex-col gap-4">
            <Badge className="w-fit border border-black/20 bg-[var(--accent)] text-[var(--foreground)]">
              {status === 'loading'
                ? 'finalizing order :3'
                : status === 'success'
                  ? 'payment complete :3'
                  : 'checkout needs help :3'}
            </Badge>
            <h1 className="font-display text-3xl leading-tight md:text-4xl">
              {status === 'success'
                ? 'thanks for your order!'
                : status === 'loading'
                  ? 'wrapping up your order...'
                  : 'we could not confirm that yet'}
            </h1>
            <p className="text-sm text-[var(--muted)] md:text-base">
              {status === 'success'
                ? "your cat-approved goodies are on the way. we'll send a confirmation email with the details and tracking once it ships."
                : status === 'loading'
                  ? 'hang tight while we confirm the payment and tidy up your cart.'
                  : message ?? 'please head back to your cart and try again.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="bg-[var(--foreground)] text-[var(--background)]"
              >
                <Link href={status === 'error' ? '/cart' : '/'}>
                  {status === 'error' ? 'back to cart' : 'keep shopping'}
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-black/40">
                <Link href="/cart">peek at cart</Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <img
              src={SUCCESS_GIF}
              alt="Happy cat celebrating"
              className="h-56 w-56 rounded-3xl border border-black/10 object-cover shadow-brutal"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
