"use client";

import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import { PRODUCT_PLACEHOLDERS } from '@/lib/categories';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/cart-store';

export const ProductCard = ({ product }: { product: Product }) => {
  const { addItem, stockById } = useCart();
  const heroImage = product.images?.[0] ?? PRODUCT_PLACEHOLDERS.images[0];
  const displayStock = stockById[product._id] ?? product.stock;

  return (
    <Card className="flex h-full flex-col border-black/20 bg-[var(--card)] pt-0">
      <div className="relative overflow-hidden rounded-t-lg border-b border-black/10 bg-white">
        <img
          src={heroImage}
          alt={product.name}
          className="h-48 w-full object-cover"
        />
        <Badge className="absolute left-3 top-3 bg-[var(--accent)] text-black">
          {product.category}
        </Badge>
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <Link href={`/products/${product._id}`}>
            <h3 className="font-display text-lg leading-tight hover:underline lowercase">
              {product.name} :3
            </h3>
          </Link>
          <p className="text-sm text-[var(--muted)] line-clamp-2">
            {product.description}
          </p>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-[var(--foreground)]">
            {formatPrice(product.price)}
          </span>
          <span className="text-[var(--muted)]">stock: {displayStock}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full bg-[var(--foreground)] text-[var(--background)]"
          onClick={() => addItem(product)}
        >
          add to cart :3
        </Button>
      </CardFooter>
    </Card>
  );
};
