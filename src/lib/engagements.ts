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
  payment_status?: "PAID" | "PENDING" | "UNPAID";
  items?: EngagementItem[];
  attachments?: EngagementAttachment[];
}

export interface EngagementTrainee {
  id: string;
  engagement_item_id: string;
  batch_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  enrollment_id: number | null;
  created_at: string;
  course_id?: number | null;
  course_name?: string;
  agreed_quantity?: number;
  batch_name?: string | null;
  batch_code?: string | null;
  batch_status?: string | null;
}

export interface EngagementTraineeInput {
  engagement_item_id: string;
  batch_id?: string | null;
  full_name: string;
  email: string;
  phone?: string | null;
}

export interface EngagementPaymentAttempt {
  reference: string;
  amount_kobo: number;
  status: string;
  payment_method: string | null;
  authorization_url: string | null;
  expires_at: string;
  created_at: string;
}

export interface EngagementPaymentRecord {
  reference: string;
  amount_kobo: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  gateway_transaction_id: string | null;
  payment_date: string | null;
  paid_amount: number | null;
  paid_currency: string | null;
}

export interface EngagementPaymentStatus {
  latest: {
    status: string;
    reference: string;
    amount_kobo: number;
    authorization_url: string | null;
    expires_at: string;
  } | null;
  payments: EngagementPaymentRecord[];
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

export const fetchEngagementTrainees = async (engagementId: string): Promise<{ trainees: EngagementTrainee[] }> => {
  const token = getAuthToken();
  return apiFetch(`/engagements/${engagementId}/trainees`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const addEngagementTrainees = async (
  engagementId: string,
  trainees: EngagementTraineeInput[],
): Promise<{ added: number; skipped: Array<{ email: string; reason: string }>; trainees: EngagementTraineeInput[] }> => {
  const token = getAuthToken();
  return apiFetch(`/engagements/${engagementId}/trainees`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: { trainees },
  });
};

export const updateEngagementTraineeBatch = async (
  engagementId: string,
  traineeId: string,
  batchId: string | null,
): Promise<{ trainee: EngagementTrainee }> => {
  const token = getAuthToken();
  return apiFetch(`/engagements/${engagementId}/trainees/${traineeId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: { batch_id: batchId },
  });
};

export const removeEngagementTrainee = async (engagementId: string, traineeId: string): Promise<{ message: string }> => {
  const token = getAuthToken();
  return apiFetch(`/engagements/${engagementId}/trainees/${traineeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const initializeEngagementPayment = async (
  engagementId: string,
  payerEmail?: string,
): Promise<{ authorization_url: string; reference: string }> => {
  const token = getAuthToken();
  return apiFetch(`/engagements/${engagementId}/payment/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: payerEmail ? { payer_email: payerEmail } : {},
  });
};

export const fetchEngagementPaymentStatus = async (engagementId: string): Promise<EngagementPaymentStatus> => {
  const token = getAuthToken();
  return apiFetch(`/engagements/${engagementId}/payment/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export interface EngagementInvoiceItem {
  course_name: string;
  agreed_quantity: number;
  unit_price: number;
  calculated_total: number | null;
  curriculum_notes?: string | null;
}

export interface EngagementInvoice {
  reference: string;
  status: string;
  engagement_name: string;
  engagement_reference: string;
  organization_name: string | null;
  total_amount: number;
  amount_kobo: number;
  currency: string;
  payment_terms: string | null;
  payment_due_window: string | null;
  expected_delivery_start: string | null;
  expected_completion: string | null;
  expires_at: string;
  items: EngagementInvoiceItem[];
}

export const requestEngagementInvoiceEmail = async (
  engagementId: string,
): Promise<{ sent_to: string; invoice_url: string; reference: string }> => {
  const token = getAuthToken();
  return apiFetch(`/engagements/${engagementId}/payment/request`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: {},
  });
};

// Public invoice endpoints — no auth; the reference is the token.
export const fetchEngagementInvoice = async (reference: string): Promise<{ invoice: EngagementInvoice }> => {
  return apiFetch(`/engagements/invoice/${encodeURIComponent(reference)}`);
};

export const payEngagementInvoice = async (
  reference: string,
  email?: string,
): Promise<{ authorization_url: string }> => {
  return apiFetch(`/engagements/invoice/${encodeURIComponent(reference)}/pay`, {
    method: "POST",
    body: email ? { email } : {},
  });
};

export const fetchEngagementInvoiceStatus = async (
  reference: string,
): Promise<{ status: string; paid: boolean }> => {
  return apiFetch(`/engagements/invoice/${encodeURIComponent(reference)}/status`);
};

export default {
  fetchEngagements,
  fetchEngagementById,
  createEngagement,
  updateEngagement,
  deleteEngagement,
  fetchEngagementStats,
};
