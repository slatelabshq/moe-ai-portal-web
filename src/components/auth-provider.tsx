'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  api,
  loadStoredToken,
  LoginResponse,
  setAccessToken,
} from '@/lib/api-client';

type AuthState = {
  user: LoginResponse['user'] | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<LoginResponse['user']>;
  signOut: () => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginResponse['user'] | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const token = loadStoredToken();
    if (!token) {
      setUser(null);
      setReady(true);
      return;
    }
    setAccessToken(token);
    try {
      setUser(await api.me());
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await api.login(email.trim().toLowerCase(), password);
    setAccessToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const signOut = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, ready, signIn, signOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
