"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { PRODUCT_PLACEHOLDERS } from '@/lib/categories';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/cart-store';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { addItem, stockById } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const images =
    product?.images?.length ? product.images : PRODUCT_PLACEHOLDERS.images;
  const displayStock =
    product && stockById[product._id] !== undefined
      ? stockById[product._id]
      : product?.stock;

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getProduct(params.id);
        if (active) {
          setProduct(data);
          setActiveImage(0);
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
  }, [params.id]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 pb-16 pt-10">
        <Button
          asChild
          variant="outline"
          className="w-fit border-black/40"
        >
          <Link href="/">back to shop :3</Link>
        </Button>

        {loading && (
          <div className="rounded-2xl border border-black/10 bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
            Loading product...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-black/10 bg-[var(--card)] p-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {product && (
          <section className="grid gap-8 rounded-3xl border border-black/10 bg-[var(--card)] p-8 shadow-brutal md:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                <img
                  src={images[activeImage] ?? images[0]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((image, index) => (
                    <button
                      type="button"
                      key={image}
                      onClick={() => setActiveImage(index)}
                      className={`overflow-hidden rounded-xl border ${
                        activeImage === index
                          ? 'border-[var(--accent-strong)]'
                          : 'border-black/10'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="h-20 w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <Badge className="w-fit bg-[var(--accent)] text-black">
                {product.category}
              </Badge>
              <h1 className="font-display text-3xl leading-tight lowercase">
                {product.name} :3
              </h1>
              <p className="text-sm text-[var(--muted)]">{product.description}</p>
              <div className="flex items-center justify-between text-base">
                <span className="font-semibold">
                  {formatPrice(product.price)}
                </span>
                <span className="text-[var(--muted)]">
                  stock: {displayStock}
                </span>
              </div>
              <Button
                className="mt-2 bg-[var(--foreground)] text-[var(--background)]"
                onClick={() => addItem(product)}
              >
                add to cart :3
              </Button>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
