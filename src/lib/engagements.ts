import { apiFetch } from "./api";
import { getAuthToken } from "./auth";

export interface EngagementItem {
  id: string;
  engagement_id: string;
  course_id?: number;
  course_name: string;
  agreed_quantity: number;
  unit_price: number;
  discount?: string;
  calculated_total?: number;
  curriculum_notes?: string;
  created_at: string;
}

export interface EngagementAttachment {
  id: string;
  engagement_id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  uploaded_at: string;
}

export interface EngagementRecord {
  id: string;
  name: string;
  reference_id: string;
  organization_id?: string;
  primary_contact?: string;
  description?: string;
  agreement_execution_date?: string;
  expected_delivery_start?: string;
  expected_completion?: string;
  status: "DRAFT" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "OUTSTANDING";
  total_amount: number;
  currency: string;
  payment_terms: string;
  invoice_triggers: string;
  payment_due_window?: string;
  statutory_notes?: string;
  created_at: string;
  updated_at: string;
  organization_name?: string;
  organization_logo?: string;
  item_count?: number;
  total_trainees?: number;
  items?: EngagementItem[];
  attachments?: EngagementAttachment[];
}

export interface EngagementPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  from: number;
  to: number;
}

export interface EngagementListResponse {
  engagements: EngagementRecord[];
  pagination: EngagementPagination;
}

export interface EngagementStats {
  total_engagements: number;
  draft_count: number;
  active_count: number;
  completed_count: number;
  outstanding_count: number;
  total_committed: number;
}

export const fetchEngagements = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
  status: string = "",
  organizationId: string = "",
): Promise<EngagementListResponse> => {
  const token = getAuthToken();
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
    status,
    organization_id: organizationId,
  });
  const data = await apiFetch(`/engagements/admin/all?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    engagements: data.engagements || [],
    pagination: data.pagination,
  };
};

export const fetchEngagementById = async (engagementId: string): Promise<{ engagement: EngagementRecord }> => {
  const token = getAuthToken();
  const data = await apiFetch(`/engagements/${engagementId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const createEngagement = async (payload: Partial<EngagementRecord>): Promise<EngagementRecord> => {
  const token = getAuthToken();
  const data = await apiFetch(`/engagements`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  });
  return data.engagement;
};

export const updateEngagement = async (engagementId: string, payload: Partial<EngagementRecord>): Promise<EngagementRecord> => {
  const token = getAuthToken();
  const data = await apiFetch(`/engagements/${engagementId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  });
  return data.engagement;
};

export const deleteEngagement = async (engagementId: string): Promise<{ message: string }> => {
  const token = getAuthToken();
  const data = await apiFetch(`/engagements/${engagementId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const fetchEngagementStats = async (): Promise<{ stats: EngagementStats }> => {
  const token = getAuthToken();
  const data = await apiFetch(`/engagements/stats/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export default {
  fetchEngagements,
  fetchEngagementById,
  createEngagement,
  updateEngagement,
  deleteEngagement,
  fetchEngagementStats,
};
