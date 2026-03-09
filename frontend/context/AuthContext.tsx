"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { AuthResponse } from "@/lib/types";

const STORAGE_KEY = "salary_transparency_auth";

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  ready: boolean;
}

const defaultState: AuthState = { token: null, userId: null, email: null, ready: false };

const AuthContext = createContext<{
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoggedIn: boolean;
}>({
  auth: defaultState,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isLoggedIn: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(defaultState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { token, userId, email } = JSON.parse(raw) as AuthResponse & { token: string };
        if (token && userId) setAuth({ token, userId, email: email ?? null, ready: true });
        else setAuth((a) => ({ ...a, ready: true }));
      } else setAuth((a) => ({ ...a, ready: true }));
    } catch {
      setAuth((a) => ({ ...a, ready: true }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login(email, password);
    const token = (data as AuthResponse & { token?: string }).token ?? "";
    const userId = (data as AuthResponse & { userId?: string }).userId ?? "";
    const payload = { token, userId, email };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setAuth({ token, userId, email, ready: true });
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const data = await api.register(email, password);
    const token = (data as AuthResponse & { token?: string }).token ?? "";
    const userId = (data as AuthResponse & { userId?: string }).userId ?? "";
    const payload = { token, userId, email };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setAuth({ token, userId, email, ready: true });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth({ token: null, userId: null, email: null, ready: true });
  }, []);

  const value = {
    auth,
    login,
    register,
    logout,
    isLoggedIn: Boolean(auth.token && auth.userId),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
