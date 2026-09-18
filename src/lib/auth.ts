import { apiFetch } from "./api";

const TOKEN_KEY = "gokly_token";

export const setAuthToken = (token) => {
  window.localStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = () => {
  return window.localStorage.getItem(TOKEN_KEY);
};

export const clearAuthToken = () => {
  window.localStorage.removeItem(TOKEN_KEY);
};

export const register = async ({ first_name, middle_name, last_name, email, password, role }) => {
  const payload = await apiFetch("/auth/register", {
    method: "POST",
    body: { first_name, middle_name, last_name, email, password, role },
  });
  if (payload.token) {
    setAuthToken(payload.token);
  }
  return payload;
};

export const login = async ({ email, password }) => {
  const payload = await apiFetch("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (payload.token) {
    setAuthToken(payload.token);
  }
  return payload;
};

export const fetchProfile = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Missing auth token.");
  }

  return apiFetch("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Missing auth token.");
  }

  return apiFetch("/auth/change-password", {
    method: "POST",
    body: { currentPassword, newPassword },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateProfile = async ({ first_name, middle_name, last_name, phone, address, city, country }) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Missing auth token.");
  }

  return apiFetch("/auth/profile", {
    method: "PUT",
    body: { first_name, middle_name, last_name, phone, address, city, country },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
