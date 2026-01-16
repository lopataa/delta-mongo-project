"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { CATEGORIES } from '@/lib/categories';
import { Product } from '@/lib/types';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getProducts();
        if (active) {
          setProducts(data);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        category === 'all' || product.category === category;
      const matchesSearch =
        !term || product.name.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [products, search, category]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 pb-16 pt-10">
        <section className="grid gap-6 rounded-3xl border border-black/10 bg-[var(--card)] p-8 shadow-brutal">
          <div className="flex flex-col gap-4">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
              schoolshop drop 02 :3
            </p>
            <h1 className="font-display text-4xl leading-tight">
              cute cat school supplies for dreamy study days :3
            </h1>
            <p className="max-w-2xl text-base text-[var(--muted)]">
              soft cream notebooks, pink pens, and backpacks with cat patches.
              add your favorites and check out in minutes.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-2xl">browse the shelves :3</h2>
              <p className="text-sm text-[var(--muted)]">
                filter by category or search by name.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search for cat notebooks"
                className="w-full border-black/20 md:w-64"
              />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full border-black/20 md:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading && (
            <div className="rounded-2xl border border-black/10 bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
              Loading products...
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-black/10 bg-[var(--card)] p-6 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="rounded-2xl border border-black/10 bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
              No products yet. Try creating a cat-themed item in the admin.
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => (
              <div key={product._id} className="animate-fade-up">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
