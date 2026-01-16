"use client";

import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { AdminLogin } from '@/components/admin-login';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { CATEGORIES, PRODUCT_PLACEHOLDERS } from '@/lib/categories';
import { formatPrice } from '@/lib/format';
import { Product } from '@/lib/types';
import { useAdminSession } from '@/lib/use-admin-session';

type ProductForm = {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  images: string[];
};

const emptyForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  category: 'Sesity',
  stock: '',
  images: [],
};

export default function AdminProductsPage() {
  const {
    ready,
    token,
    status: authStatus,
    error: authError,
    login,
    logout,
  } = useAdminSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    const data = await api.getProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    loadProducts();
  }, [token]);

  const resetForm = (clearStatus = false) => {
    setForm(emptyForm);
    setEditingId(null);
    setImageUrl('');
    setUploadStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (clearStatus) {
      setStatus(null);
    }
  };

  const addImageUrl = () => {
    const trimmed = imageUrl.trim();
    if (!trimmed) return;
    setForm((prev) => ({ ...prev, images: [...prev.images, trimmed] }));
    setImageUrl('');
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
  };

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadStatus('uploading...');

    try {
      const fileList = Array.from(files);
      const presign = await api.presignUploads(
        fileList.map((file) => ({
          filename: file.name,
          contentType: file.type,
        })),
      );

      const results = await Promise.all(
        presign.uploads.map((upload, index) => {
          const file = fileList[index];
          return fetch(upload.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: file.type ? { 'Content-Type': file.type } : undefined,
          });
        }),
      );

      if (results.some((res) => !res.ok)) {
        throw new Error('image upload failed.');
      }

      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...presign.uploads.map((item) => item.fileUrl)],
      }));
      setUploadStatus('images uploaded.');
    } catch (err) {
      if (err instanceof Error && err.message.includes('Admin')) {
        logout();
        return;
      }
      setUploadStatus(
        err instanceof Error ? err.message : 'image upload failed.',
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    const price = Number(form.price);
    const stock = Number(form.stock);
    const images = form.images.map((image) => image.trim()).filter(Boolean);

    if (!form.name || !form.description || images.length === 0) {
      setStatus('Please fill all required fields and add at least one image.');
      return;
    }

    if (Number.isNaN(price) || Number.isNaN(stock)) {
      setStatus('Price and stock must be numbers.');
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      price,
      category: form.category,
      stock,
      images,
    };

    try {
      if (editingId) {
        await api.updateProduct(editingId, payload);
        setStatus('Product updated.');
      } else {
        await api.createProduct(payload);
        setStatus('Product created.');
      }

      resetForm();
      await loadProducts();
    } catch (err) {
      if (err instanceof Error && err.message.includes('Admin')) {
        logout();
        return;
      }
      setStatus(err instanceof Error ? err.message : 'Save failed.');
    }
  };

  const onEdit = (product: Product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      category: product.category,
      stock: String(product.stock),
      images: product.images ?? [],
    });
  };

  const onDelete = async (id: string) => {
    try {
      await api.deleteProduct(id);
      await loadProducts();
    } catch (err) {
      if (err instanceof Error && err.message.includes('Admin')) {
        logout();
      }
    }
  };

  const fillSample = () => {
    setForm((prev) => ({
      ...prev,
      name: PRODUCT_PLACEHOLDERS.name,
      description: PRODUCT_PLACEHOLDERS.description,
      images: PRODUCT_PLACEHOLDERS.images,
    }));
  };

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
            <h1 className="font-display text-3xl">admin products :3</h1>
            <p className="text-sm text-[var(--muted)]">
              create cat-themed notebooks, pens, and backpacks.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="border-black/40">
              <Link href="/admin/orders">view orders :3</Link>
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
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl">
                {editingId ? 'edit product :3' : 'add new product :3'}
              </h2>
              <p className="text-sm text-[var(--muted)]">
                upload to minio or paste a direct image url.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={fillSample}>
              fill cat sample :3
            </Button>
          </div>

          <form onSubmit={onSubmit} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="product name"
                className="border-black/20"
              />
              <Input
                required
                value={form.price}
                onChange={(event) =>
                  setForm({ ...form, price: event.target.value })
                }
                type="number"
                min="0"
                placeholder="price czk"
                className="border-black/20"
              />
            </div>
            <Textarea
              required
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              placeholder="short description"
              className="min-h-[110px] border-black/20"
            />
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                required
                type="number"
                min="0"
                value={form.stock}
                onChange={(event) =>
                  setForm({ ...form, stock: event.target.value })
                }
                placeholder="stock"
                className="border-black/20"
              />
              <Select
                value={form.category}
                onValueChange={(value) =>
                  setForm({ ...form, category: value })
                }
              >
                <SelectTrigger className="border-black/20">
                  <SelectValue placeholder="category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((item) => item.value !== 'all').map(
                    (item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <div className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-[var(--muted)]">
                {form.images.length} image{form.images.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onUpload}
                  disabled={uploading}
                  className="border-black/20"
                />
                <Input
                  type="url"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addImageUrl();
                    }
                  }}
                  placeholder="paste an image url"
                  className="min-w-[220px] border-black/20"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-black/40"
                  onClick={addImageUrl}
                >
                  add image url :3
                </Button>
              </div>
              {uploadStatus && (
                <div className="rounded-xl border border-black/10 bg-white p-3 text-sm">
                  {uploadStatus}
                </div>
              )}
              {form.images.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {form.images.map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="relative overflow-hidden rounded-2xl border border-black/10"
                    >
                      <img
                        src={image}
                        alt={`upload ${index + 1}`}
                        className="h-32 w-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="absolute right-2 top-2 bg-white/80 text-xs"
                        onClick={() => removeImage(index)}
                      >
                        remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {status && (
              <div className="rounded-xl border border-black/10 bg-white p-3 text-sm">
                {status}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                className="bg-[var(--foreground)] text-[var(--background)]"
              >
                {editingId ? 'save changes' : 'add product'}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => resetForm(true)}
                >
                  cancel
                </Button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-black/10 bg-[var(--card)] p-6 shadow-brutal">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">inventory :3</h2>
            <span className="text-sm text-[var(--muted)]">
              {loading ? 'loading...' : `${products.length} products`}
            </span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const preview =
                    product.images?.[0] ?? PRODUCT_PLACEHOLDERS.images[0];
                  const extraCount = Math.max(
                    0,
                    (product.images?.length ?? 0) - 1,
                  );

                  return (
                    <TableRow key={product._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={preview}
                              alt={product.name}
                              className="h-12 w-12 rounded-xl border border-black/10 object-cover"
                            />
                            {extraCount > 0 && (
                              <span className="absolute -right-2 -top-2 rounded-full border border-black/10 bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-black">
                                +{extraCount}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-[var(--muted)]">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-[var(--accent)] text-black">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatPrice(product.price)}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="border-black/30"
                            onClick={() => onEdit(product)}
                          >
                            edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-[var(--muted)]"
                            onClick={() => onDelete(product._id)}
                          >
                            delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
