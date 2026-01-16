"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { AdminLogin } from '@/components/admin-login';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { Order } from '@/lib/types';
import { useAdminSession } from '@/lib/use-admin-session';

export default function AdminOrdersPage() {
  const {
    ready,
    token,
    status: authStatus,
    error: authError,
    login,
    logout,
  } = useAdminSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getOrders();
        setOrders(data);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.message.includes('Admin')) {
          logout();
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, logout]);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 pb-16 pt-10">
          <div className="rounded-2xl border border-black/10 bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
            loading admin...
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 pb-16 pt-10">
          <AdminLogin
            onLogin={login}
            status={authStatus}
            error={authError}
          />
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 pb-16 pt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl">admin orders :3</h1>
            <p className="text-sm text-[var(--muted)]">
              see every cat-approved checkout.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="border-black/40">
              <Link href="/admin/products">back to products :3</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-black/40"
              onClick={logout}
            >
              log out :3
            </Button>
          </div>
        </div>

        <section className="rounded-3xl border border-black/10 bg-[var(--card)] p-6 shadow-brutal">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">order list :3</h2>
            <span className="text-sm text-[var(--muted)]">
              {loading ? 'loading...' : `${orders.length} orders`}
            </span>
          </div>
          {error && (
            <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.customerName}</span>
                        <span className="text-xs text-[var(--muted)]">
                          {order.email}
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          {order.phone}
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          {order.address}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {order.items.map((item) => (
                          <div key={item.productId} className="flex gap-2">
                            <Badge className="bg-[var(--accent)] text-black">
                              {item.quantity}x
                            </Badge>
                            <span className="text-sm">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(order.total)}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--muted)]">
                      {new Date(order.createdAt).toLocaleDateString('cs-CZ')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
