// ─── context/AuthContext.jsx ──────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../api/services.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true while hydrating from localStorage

  // ── Hydrate on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("quiziq_token");
    const cached = localStorage.getItem("quiziq_user");

    if (token && cached) {
      setUser(JSON.parse(cached));
      // Verify token is still valid in background
      authAPI
        .me()
        .then((res) => {
          setUser(res.user);
          localStorage.setItem("quiziq_user", JSON.stringify(res.user));
        })
        .catch(() => {
          // Token expired or invalid — log out silently
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem("quiziq_token", res.token);
    localStorage.setItem("quiziq_user", JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  }, []);

  // ── Register ────────────────────────────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    localStorage.setItem("quiziq_token", res.token);
    localStorage.setItem("quiziq_user", JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("quiziq_token");
    localStorage.removeItem("quiziq_user");
    setUser(null);
  }, []);

  // ── Patch user locally (after quiz submit) ───────────────────────────────────
  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("quiziq_user", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
