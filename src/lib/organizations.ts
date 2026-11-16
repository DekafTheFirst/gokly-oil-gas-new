import { apiFetch } from "./api";
import { getAuthToken } from "./auth";

export interface OrganizationRecord {
  id: string;
  name: string;
  organization_type?: string;
  primary_contact?: string;
  primary_contact_title?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  cac_rc_number?: string;
  website?: string;
  industry?: string;
  number_of_engagements?: number;
  status: string;
  created_at: string;
  updated_at?: string;
  logo_url?: string;
}

export interface OrganizationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  from: number;
  to: number;
}

export interface OrganizationListResponse {
  organizations: OrganizationRecord[];
  pagination: OrganizationPagination;
}

export const fetchOrganizations = async (): Promise<OrganizationRecord[]> => {
  const data = await apiFetch(`/organizations`);
  return data.organizations || [];
};

export const fetchAdminOrganizations = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
): Promise<OrganizationListResponse> => {
  const token = getAuthToken();
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
  });
  const data = await apiFetch(`/organizations/admin/all?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    organizations: data.organizations || [],
    pagination: data.pagination,
  };
};

export const createOrganization = async (payload: Partial<OrganizationRecord>): Promise<OrganizationRecord> => {
  const token = getAuthToken();
  const data = await apiFetch(`/organizations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  });
  return data.organization;
};

export const fetchOrganizationById = async (organizationId: string): Promise<{ organization: OrganizationRecord }> => {
  const token = getAuthToken();
  const data = await apiFetch(`/organizations/${organizationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const updateOrganization = async (organizationId: string, payload: Partial<OrganizationRecord>): Promise<OrganizationRecord> => {
  const token = getAuthToken();
  const data = await apiFetch(`/organizations/${organizationId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  });
  return data.organization;
};

export interface OrganizationTrainee {
  id: string;
  user_id: number | null;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  account_active?: boolean | null;
  email_verified_at?: string | null;
  last_login_at?: string | null;
  invite_pending?: boolean;
}

export interface OrganizationTraineeInput {
  full_name: string;
  email: string;
  phone?: string;
}

export interface AddOrganizationTraineesResponse {
  added: number;
  accounts_created: number;
  invites_sent: number;
  invites_failed: number;
  smtp_configured: boolean;
  skipped: Array<{ email: string; reason: string }>;
  trainees: OrganizationTrainee[];
}

export const fetchOrganizationTrainees = async (
  organizationId: string,
  search: string = "",
): Promise<{ trainees: OrganizationTrainee[] }> => {
  const token = getAuthToken();
  const params = new URLSearchParams({ search });
  return apiFetch(`/organizations/${organizationId}/trainees?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const addOrganizationTrainees = async (
  organizationId: string,
  trainees: OrganizationTraineeInput[],
): Promise<AddOrganizationTraineesResponse> => {
  const token = getAuthToken();
  return apiFetch(`/organizations/${organizationId}/trainees`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: { trainees },
  });
};

export interface OrganizationTraineePreviewStatus {
  in_pool: boolean;
  has_account: boolean;
  account_active: boolean;
  invite_pending: boolean;
}

export const previewOrganizationTrainees = async (
  organizationId: string,
  trainees: OrganizationTraineeInput[],
): Promise<{ statuses: Record<string, OrganizationTraineePreviewStatus> }> => {
  const token = getAuthToken();
  return apiFetch(`/organizations/${organizationId}/trainees/preview`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: { trainees },
  });
};

export const resendOrganizationTraineeInvite = async (
  organizationId: string,
  traineeId: string,
): Promise<{ message: string }> => {
  const token = getAuthToken();
  return apiFetch(`/organizations/${organizationId}/trainees/${traineeId}/resend-invite`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: {},
  });
};

export const removeOrganizationTrainee = async (
  organizationId: string,
  traineeId: string,
): Promise<{ message: string }> => {
  const token = getAuthToken();
  return apiFetch(`/organizations/${organizationId}/trainees/${traineeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
};

export default { fetchOrganizations, fetchAdminOrganizations, createOrganization, fetchOrganizationById, updateOrganization };
