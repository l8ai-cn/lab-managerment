import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("labos_user");
    const token = localStorage.getItem("labos_token");
    if (saved && token) {
      setUser(JSON.parse(saved));
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    // Call FastAPI auth login endpoint
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);

    const res = await axios.post("/api/v1/auth/login", params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const { access_token, user: userData } = res.data;
    localStorage.setItem("labos_token", access_token);
    localStorage.setItem("labos_user", JSON.stringify(userData));
    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("labos_token");
    localStorage.removeItem("labos_user");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
