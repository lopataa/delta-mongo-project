"use client";

import Link from 'next/link';
import { useCart } from '@/lib/cart-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const SiteHeader = () => {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[var(--background)]/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="font-display text-2xl tracking-tight">
            schoolshop :3
          </span>
          <Badge className="border border-black/20 bg-[var(--card)] text-[12px] font-medium text-[var(--foreground)]">
            cat supplies
          </Badge>
        </Link>
        <nav className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            className="border-black/40 text-sm font-semibold"
          >
            <Link href="/">shop</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-black/40 text-sm font-semibold"
          >
            <Link href="/admin/products">admin</Link>
          </Button>
          <Button
            asChild
            className="bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--foreground)]"
          >
            <Link href="/cart">cart :3 ({itemCount})</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
};
