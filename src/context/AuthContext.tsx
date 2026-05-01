import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authService from "@/lib/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const { user: profile } = await authService.fetchProfile();
        setUser(profile);
      } catch (_error) {
        authService.clearAuthToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const login = async (values) => {
    const payload = await authService.login(values);
    setUser(payload.user);
    setError(null);
    return payload;
  };

  const register = async (values) => {
    const payload = await authService.register(values);
    setUser(payload.user);
    setError(null);
    return payload;
  };

  const logout = () => {
    authService.clearAuthToken();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, error, login, register, logout, setError }),
    [user, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
