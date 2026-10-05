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

export default { fetchOrganizations, fetchAdminOrganizations, createOrganization, fetchOrganizationById, updateOrganization };
