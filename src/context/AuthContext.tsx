"use client";

import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/axios";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
    }
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });

    setToken(res.data.token);
    setUser(res.data.user);

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    api.defaults.headers.common.Authorization = `Bearer ${res.data.token}`;
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.clear();
    delete api.defaults.headers.common.Authorization;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
