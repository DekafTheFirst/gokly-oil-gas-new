import { apiFetch } from "./api";
import { getAuthToken } from "./auth";

export type UserRole = "ADMIN" | "TRAINER" | "STUDENT";

export interface UserRecord {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface UserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserResponse {
  users: UserRecord[];
  pagination: UserPagination;
}

export interface UserPayload {
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UserUpdatePayload {
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  email?: string;
  role?: UserRole;
  password?: string;
}

export const fetchAllUsers = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
  role: string = "all",
): Promise<UserResponse> => {
  const token = getAuthToken();
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
    role,
  });
  const data = await apiFetch(`/users/admin/all?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const createUser = async (payload: UserPayload): Promise<UserRecord> => {
  const token = getAuthToken();
  const data = await apiFetch("/users", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  });
  return data.user;
};

export const updateUser = async (userId: number, payload: UserUpdatePayload): Promise<UserRecord> => {
  const token = getAuthToken();
  const data = await apiFetch(`/users/${userId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  });
  return data.user;
};

export const deleteUser = async (userId: number): Promise<void> => {
  const token = getAuthToken();
  await apiFetch(`/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
};
