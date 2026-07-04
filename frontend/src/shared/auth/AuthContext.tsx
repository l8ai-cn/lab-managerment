import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, authStorage, type AuthUser } from "@/shared/api/client";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(authStorage.getUser());
  const [loading, setLoading] = useState(!!authStorage.getToken());

  useEffect(() => {
    if (authStorage.getToken()) {
      authApi
        .me()
        .then((u) => {
          setUser(u);
          authStorage.setUser(u);
        })
        .catch(() => {
          authStorage.clear();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await authApi.login(username.trim().toLowerCase(), password);
    authStorage.setToken(res.access_token);
    authStorage.setUser(res.user);
    setUser(res.user);
  };

  const logout = () => {
    authStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
