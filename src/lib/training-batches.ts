import { apiFetch } from "./api";
import { getAuthToken } from "./auth";

export type TrainingBatchStatus = "DRAFT" | "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface TrainingBatchSession {
  id?: string;
  course_module_id: number;
  title: string;
  description?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string;
}

export interface TrainingBatchAllocation {
  allocation_type: "CONTRACT" | "OPEN_ENROLLMENT";
  engagement_item_id?: string;
  seats_assigned: number;
}

export interface TrainingBatchPayload {
  course_id: number;
  name: string;
  batch_code?: string;
  location?: string;
  capacity?: number;
  min_quorum?: number;
  notes?: string;
  status: "DRAFT" | "UPCOMING";
  sessions: TrainingBatchSession[];
  allocations: TrainingBatchAllocation[];
}

export interface TrainingBatchCourseModule {
  id: number;
  course_id: number;
  name: string;
  description?: string;
  duration?: number;
  scheduled_date?: string | null;
  sort_order: number;
}

export interface TrainingBatchCourseOption {
  id: number;
  title: string;
  code?: string;
  category?: string;
  delivery_mode: "PHYSICAL" | "ONLINE" | "HYBRID";
  status: string;
  modules: TrainingBatchCourseModule[];
}

export interface TrainingBatchAllocationOption {
  engagement_item_id: string;
  engagement_id: string;
  course_id: number | null;
  course_name: string;
  agreed_quantity: number;
  reference_id: string;
  engagement_name: string;
  organization_id: string | null;
  organization_name: string | null;
  reserved_seats: number;
  utilized: number;
  available_seats: number;
}

export interface TrainingBatchListItem {
  id: string;
  course_id: number;
  course_title: string;
  name: string;
  batch_code: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  capacity: number | null;
  min_quorum: number | null;
  delivery_mode: "PHYSICAL" | "ONLINE" | "HYBRID";
  status: TrainingBatchStatus;
  enrolled_count: number;
  session_count: number;
  allocation_count: number;
}

export interface TrainingBatchAllocationDetail extends TrainingBatchAllocation {
  id: string;
  engagement_id?: string | null;
  organization_id?: string | null;
  reference_id?: string | null;
  engagement_name?: string | null;
  organization_name?: string | null;
  course_name?: string | null;
  agreed_quantity?: number | null;
}

export interface TrainingBatchDetail extends Omit<
  TrainingBatchListItem,
  "enrolled_count" | "session_count" | "allocation_count"
> {
  sessions: TrainingBatchSession[];
  allocations: TrainingBatchAllocationDetail[];
}

export interface TrainingBatchStats {
  total_batches: number;
  draft_count: number;
  upcoming_count: number;
  active_count: number;
  completed_count: number;
  cancelled_count: number;
}

export interface TrainingBatchFilterOptions {
  courses: Array<{ id: number; title: string }>;
  locations: string[];
}

const authHeaders = () => {
  const token = getAuthToken();
  if (!token) throw new Error("Your session has expired. Please sign in again.");
  return { Authorization: `Bearer ${token}` };
};

export async function fetchTrainingBatchOptions(courseId?: number) {
  const params = new URLSearchParams();
  if (courseId) params.set("course_id", String(courseId));
  const query = params.toString();
  return apiFetch(`/training-batches/options${query ? `?${query}` : ""}`, {
    headers: authHeaders(),
  }) as Promise<{
    courses: TrainingBatchCourseOption[];
    allocation_options: TrainingBatchAllocationOption[];
  }>;
}

export async function fetchTrainingBatches(
  page = 1,
  limit = 10,
  search = "",
  status = "",
  courseId = "",
  location = "",
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search,
  });
  if (status) params.set("status", status);
  if (courseId) params.set("course_id", courseId);
  if (location) params.set("location", location);
  return apiFetch(`/training-batches/admin/all?${params}`, {
    headers: authHeaders(),
  }) as Promise<{
    batches: TrainingBatchListItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number; from: number; to: number };
    filter_options: TrainingBatchFilterOptions;
  }>;
}

export async function fetchTrainingBatchStats() {
  return apiFetch("/training-batches/stats/summary", {
    headers: authHeaders(),
  }) as Promise<{ stats: TrainingBatchStats }>;
}

export async function fetchTrainingBatch(batchId: string) {
  return apiFetch(`/training-batches/${encodeURIComponent(batchId)}`, {
    headers: authHeaders(),
  }) as Promise<{ batch: TrainingBatchDetail }>;
}

export async function createTrainingBatch(payload: TrainingBatchPayload) {
  return apiFetch("/training-batches", {
    method: "POST",
    headers: authHeaders(),
    body: payload,
  }) as Promise<{ batch: TrainingBatchListItem }>;
}

export async function updateTrainingBatch(batchId: string, payload: TrainingBatchPayload) {
  return apiFetch(`/training-batches/${encodeURIComponent(batchId)}`, {
    method: "PUT",
    headers: authHeaders(),
    body: payload,
  }) as Promise<{ batch: TrainingBatchListItem }>;
}
