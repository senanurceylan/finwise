import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { api, setApiToken } from '@/lib/api';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const TOKEN_KEY = 'finwise_mobile_token';
const USER_KEY = 'finwise_mobile_user';

const AuthContext = createContext<AuthContextValue | null>(null);

async function saveSession(token: string, user: User) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function clearSession() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((nextToken: string | null, nextUser: User | null) => {
    setToken(nextToken);
    setUser(nextUser);
    setApiToken(nextToken);
  }, []);

  useEffect(() => {
    async function hydrateSession() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        applySession(storedToken, storedUser ? (JSON.parse(storedUser) as User) : null);
      } finally {
        setLoading(false);
      }
    }
    hydrateSession();
  }, [applySession]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ token: string; user: User; error?: string }>('/auth/login', { email, password });
    if (!data.token || !data.user) {
      throw new Error(data.error || 'Giriş başarısız.');
    }
    await saveSession(data.token, data.user);
    applySession(data.token, data.user);
  }, [applySession]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await api.post<{ token: string; user: User; error?: string }>('/auth/register', { name, email, password });
    if (!data.token || !data.user) {
      throw new Error(data.error || 'Kayıt başarısız.');
    }
    await saveSession(data.token, data.user);
    applySession(data.token, data.user);
  }, [applySession]);

  const logout = useCallback(async () => {
    await clearSession();
    applySession(null, null);
  }, [applySession]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
  }), [user, token, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
