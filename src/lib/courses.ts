import { apiFetch, API_BASE_URL } from "./api";
import { getAuthToken } from "./auth";
import type { ModuleMaterial } from "../components/educert/ModuleMaterials";

export interface CourseEnrollmentBatch {
  id: string;
  name: string;
  batch_code: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  delivery_mode?: string | null;
  trainer_name?: string | null;
  registration_start_date: string | null;
  registration_end_date: string | null;
  registration_status: "open" | "upcoming" | "closed";
}

export interface CourseRecord {
  id: number;
  title: string;
  code?: string;
  category: string;
  description: string;
  short_description?: string;
  tier?: string;
  hours?: string;
  duration_value?: number;
  duration_unit?: string;
  delivery_mode?: string;
  status?: string;
  individual_enrollment_enabled?: boolean;
  certificate_enabled?: boolean;
  // External certificate generation/validation (e.g. MISTDO → NMDPRA).
  // When `certificate_external` is true, generation + official validation are
  // controlled by the external authority, but records can still be verified
  // centrally by linking to the official license ID / portal.
  certificate_external?: boolean;
  certificate_authority?: string | null;
  certificate_license_id?: string | null;
  certificate_portal_url?: string | null;
  thumbnail_url?: string | null;
  image?: string | null;
  min_class_size?: number;
  max_class_size?: number;
  price?: number | null;
  currency?: string;
  prerequisite_required?: boolean;
  prerequisite_type?: "internal" | "external" | null;
  prerequisite_course_id?: number | null;
  prerequisite_description?: string;
  enrollment_batch?: CourseEnrollmentBatch | null;
  created_at: string;
}

export function formatShortCourseDate(value: string | null | undefined) {
  if (!value) return "";
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function registrationStatusLabel(batch: CourseEnrollmentBatch) {
  if (batch.registration_status === "open") return "Registration open";
  if (batch.registration_status === "upcoming") {
    return batch.registration_start_date
      ? `Registration opens ${formatShortCourseDate(batch.registration_start_date)}`
      : "Registration upcoming";
  }
  return "Registration closed";
}

export function registrationWindowLabel(batch: CourseEnrollmentBatch) {
  const opens = batch.registration_start_date;
  const closes = batch.registration_end_date;
  if (opens && closes) {
    return opens === closes
      ? `Reg closes ${formatShortCourseDate(closes)}`
      : `Registration Window: ${formatShortCourseDate(opens)} – ${formatShortCourseDate(closes)}`;
  }
  if (opens) return `Registration from ${formatShortCourseDate(opens)}`;
  if (closes) return `Registration until ${formatShortCourseDate(closes)}`;
  return null;
}

export interface CourseFinalAssessment {
  id: string;
  title: string;
  description: string | null;
  type: string;
  max_score: number;
  pass_mark: number;
  is_required: boolean;
}

export interface CourseDetailResponse {
  course: CourseRecord;
  modules: CourseModule[];
  trainers: Array<{ id: number; name: string; email: string }>;
  final_assessment: CourseFinalAssessment | null;
}

export interface PublicCourseDetailResponse {
  course: CourseRecord;
  modules: CourseModule[];
}

export interface ModuleAssessmentConfig {
  type: string;
  max_score: number;
  pass_mark: number;
  attempts_allowed: number;
  required: boolean;
  description?: string;
}

export interface CourseModule {
  name: string;
  description?: string;
  has_assessment?: boolean;
  scheduled_date?: string;
  // Inline per-module assessment setup (configured at module-creation time, Step 2).
  // Persisted to the backend as part of the module payload; unknown keys are
  // ignored by older backends, and the `has_assessment` flag always stays in sync.
  assessment_type?: string;
  assessment_max_score?: number;
  assessment_pass_mark?: number;
  assessment_attempts_allowed?: number;
  assessment_required?: boolean;
  assessment_description?: string;
  sort_order?: number;
  is_required?: boolean;
  materials?: ModuleMaterial[];
  duration?: number;
  delivery_type?: string;
}

export interface CoursePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  from: number;
  to: number;
}

export interface CourseListResponse {
  courses: CourseRecord[];
  pagination: CoursePagination;
}

export const fetchCourses = async (): Promise<CourseRecord[]> => {
  const data = await apiFetch(`/courses`);
  return data.courses || [];
};

export const fetchPublicCourses = async (): Promise<CourseRecord[]> => {
  const data = await apiFetch(`/courses/public`);
  return data.courses || [];
};

export const fetchMyEnrolledCourseIds = async (): Promise<number[]> => {
  const token = getAuthToken();
  const data = await apiFetch("/courses/my-enrollments", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.course_ids || [];
};

export const fetchPublicCourseById = async (courseId: number): Promise<PublicCourseDetailResponse> => {
  return apiFetch(`/courses/public/${courseId}`);
};

// Paginated course list used by the admin course management table.
export const fetchAdminCourses = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
): Promise<CourseListResponse> => {
  const token = getAuthToken();
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
  });
  const data = await apiFetch(`/courses/admin/all?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    courses: data.courses || [],
    pagination: data.pagination,
  };
};

export const createCourse = async (payload: Partial<CourseRecord>): Promise<CourseRecord> => {
  const token = getAuthToken();
  const data = await apiFetch(`/courses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  });
  return data.course;
};

export const enrollInCourse = async (courseId: number): Promise<void> => {
  const token = getAuthToken();
  await apiFetch(`/courses/${courseId}/enroll`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
};

export type CoursePaymentMethod = "CARD" | "BANK_TRANSFER";

export const initializeCoursePayment = async (
  courseId: number,
): Promise<{ authorization_url: string }> => {
  const token = getAuthToken();
  return apiFetch(`/payments/courses/${courseId}/initialize`, {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
  });
};

export type CoursePaymentAttemptStatus =
  | "NONE"
  | "INITIALIZING"
  | "PENDING"
  | "FAILED"
  | "EXPIRED"
  | "SUCCESSFUL";

export interface CoursePaymentStatus {
  status: CoursePaymentAttemptStatus;
  enrolled: boolean;
  reference: string | null;
  amount_kobo: number | null;
  attempts: { used_24h: number; max: number; remaining: number };
}

export const fetchCoursePaymentStatus = async (
  courseId: number,
): Promise<CoursePaymentStatus> => {
  const token = getAuthToken();
  return apiFetch(`/payments/courses/${courseId}/status`, {
    headers: { Authorization: "Bearer " + token },
  });
};

export const downloadCourseReceipt = async (reference: string): Promise<void> => {
  const token = getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/payments/receipts/${encodeURIComponent(reference)}`,
    { headers: { Authorization: "Bearer " + token } },
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Could not download the receipt.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download =
    response.headers.get("x-receipt-filename") || `gokly-receipt-${reference}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const verifyCoursePayment = async (
  reference: string,
): Promise<{ status: string; enrolled: boolean; amount_kobo: number; payment_method: CoursePaymentMethod | "OTHER" }> => {
  const token = getAuthToken();
  const path = "/payments/verify?reference=" + encodeURIComponent(reference);
  return apiFetch(path, {
    headers: { Authorization: "Bearer " + token },
  });
};

export const fetchCourseById = async (courseId: number): Promise<CourseDetailResponse> => {
  const token = getAuthToken();
  const data = await apiFetch(`/courses/${courseId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const updateCourse = async (courseId: number, payload: Partial<CourseRecord>): Promise<CourseRecord> => {
  const token = getAuthToken();
  const data = await apiFetch(`/courses/${courseId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  });
  return data.course;
};

export default { fetchCourses, fetchAdminCourses, createCourse, enrollInCourse, fetchCourseById, updateCourse };
