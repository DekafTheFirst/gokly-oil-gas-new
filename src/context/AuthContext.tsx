import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authService from "@/lib/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshProfile = useCallback(async () => {
    const payload = await authService.fetchProfile();
    setUser(payload.user);
    setError(null);
    return payload;
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        await refreshProfile();
      } catch (_error) {
        authService.clearAuthToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [refreshProfile]);

  const login = async (values) => {
    const payload = await authService.login(values);
    setUser(payload.user);
    setError(null);
    return payload;
  };

  const register = async (values) => {
    const payload = await authService.register(values);
    setError(null);
    return payload;
  };

  const logout = () => {
    authService.clearAuthToken();
    setUser(null);
  };

  const changePassword = async (values) => {
    const payload = await authService.changePassword(values);
    setError(null);
    return payload;
  };

  const updateProfile = async (values) => {
    const payload = await authService.updateProfile(values);
    setUser(payload.user);
    setError(null);
    return payload;
  };

  const value = useMemo(
    () => ({ user, loading, error, login, register, logout, changePassword, updateProfile, refreshProfile, setError }),
    [user, loading, error, refreshProfile],
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
