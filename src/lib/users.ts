import { apiFetch } from "./api";
import { getAuthToken } from "./auth";

export type UserRole = "ADMIN" | "TRAINER" | "TRAINEE";

export interface UserRecord {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  created_at: string;
}

export interface UserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  from: number;
  to: number;
}

export interface UserRoleCounts {
  all: number;
  ADMIN: number;
  TRAINER: number;
  TRAINEE: number;
}

export interface UserResponse {
  users: UserRecord[];
  pagination: UserPagination;
  counts: UserRoleCounts;
  trainee_stats?: TraineeStats;
}

export interface TraineeStats {
  total: number;
  active: number;
  inactive: number;
  new_this_month: number;
}

export interface UserPayload {
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  gender?: "Male" | "Female" | "Other";
  date_of_birth?: string;
  nationality?: string;
  state?: string;
  nin?: string;
  nogic_candidate_number?: string;
  ogisp_passport_id?: string;
  emergency_contact?: string;
  occupation?: string;
  corporate_staff_id?: string;
  organization_id?: string;
}

export interface UserUpdatePayload {
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  email?: string;
  role?: UserRole;
  password?: string;
  is_active?: boolean;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

export const fetchAllUsers = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
  role: string = "all",
  status: "all" | "active" | "inactive" = "all",
): Promise<UserResponse> => {
  const token = getAuthToken();
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
    role,
    status,
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

export const toggleUserActivation = async (userId: number, isActive: boolean): Promise<UserRecord> => {
  const token = getAuthToken();
  const data = await apiFetch(`/auth/${userId}/activation`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: { is_active: isActive },
  });
  return data.user;
};
