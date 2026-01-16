"use client";

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AdminLoginProps = {
  onLogin: (password: string) => Promise<boolean>;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
};

export const AdminLogin = ({ onLogin, status, error }: AdminLoginProps) => {
  const [password, setPassword] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onLogin(password);
  };

  return (
    <section className="rounded-3xl border border-black/10 bg-[var(--card)] p-6 shadow-brutal">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-2xl">admin login :3</h2>
        <p className="text-sm text-[var(--muted)]">
          enter the admin password to manage products and orders.
        </p>
      </div>
      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3">
        <Input
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="admin password"
          className="border-black/20"
        />
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
          {status === 'loading' ? 'unlocking...' : 'unlock admin'}
        </Button>
      </form>
    </section>
  );
};
