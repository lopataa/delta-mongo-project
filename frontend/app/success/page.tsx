import { Suspense } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Badge } from '@/components/ui/badge';
import { SuccessContent } from './success-client';

export default function SuccessPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <Suspense
        fallback={
          <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 pb-16 pt-12">
            <section className="relative overflow-hidden rounded-3xl border border-black/10 bg-[var(--card)] p-8 shadow-brutal">
              <div className="flex flex-col gap-4">
                <Badge className="w-fit border border-black/20 bg-[var(--accent)] text-[var(--foreground)]">
                  finalizing order :3
                </Badge>
                <h1 className="font-display text-3xl leading-tight md:text-4xl">
                  wrapping up your order...
                </h1>
                <p className="text-sm text-[var(--muted)] md:text-base">
                  hang tight while we confirm the payment and tidy up your cart.
                </p>
              </div>
            </section>
          </main>
        }
      >
        <SuccessContent />
      </Suspense>
      <SiteFooter />
    </div>
  );
}
