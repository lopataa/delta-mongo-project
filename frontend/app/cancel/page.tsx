'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const CANCEL_GIF =
  'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif';

export default function CancelPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/cart');
    }, 4500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 pb-16 pt-12">
        <section className="relative overflow-hidden rounded-3xl border border-black/10 bg-[var(--card)] p-8 shadow-brutal">
          <div className="pointer-events-none absolute -left-12 -top-8 h-40 w-40 rounded-full bg-[var(--accent-strong)]/40 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-36 w-36 translate-x-10 translate-y-8 rounded-full bg-[var(--accent)]/60 blur-2xl" />
          <div className="relative grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div className="flex flex-col gap-4">
              <Badge className="w-fit border border-black/20 bg-[var(--card)] text-[var(--foreground)]">
                checkout paused :3
              </Badge>
              <h1 className="font-display text-3xl leading-tight md:text-4xl">
                no worries, your cart is safe
              </h1>
              <p className="text-sm text-[var(--muted)] md:text-base">
                looks like the checkout was canceled. hop back to your cart when
                you are ready and we will keep the goodies waiting.
              </p>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                returning to cart in a few seconds...
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="bg-[var(--foreground)] text-[var(--background)]"
                >
                  <Link href="/cart">return to cart</Link>
                </Button>
                <Button asChild variant="outline" className="border-black/40">
                  <Link href="/">keep browsing</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <img
                src={CANCEL_GIF}
                alt="Cat taking a pause"
                className="h-56 w-56 rounded-3xl border border-black/10 object-cover shadow-brutal"
                loading="lazy"
              />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
