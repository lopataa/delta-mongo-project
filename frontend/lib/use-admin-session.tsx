"use client";

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { clearAdminToken, getAdminToken, setAdminToken } from './admin-auth';

type AuthStatus = 'idle' | 'loading' | 'error';

export const useAdminSession = () => {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setToken(getAdminToken());
    setReady(true);
  }, []);

  const login = useCallback(async (password: string) => {
    setStatus('loading');
    setError(null);
    try {
      const data = await api.adminLogin(password);
      setAdminToken(data.token);
      setToken(data.token);
      setStatus('idle');
      return true;
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Login failed');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    clearAdminToken();
    setToken(null);
  }, []);

  return { ready, token, status, error, login, logout };
};
