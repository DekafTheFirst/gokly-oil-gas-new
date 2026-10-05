import { apiFetch } from "./api";
import { getAuthToken } from "./auth";

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
  price?: number;
  currency?: string;
  prerequisite_required?: boolean;
  prerequisite_type?: "internal" | "external" | null;
  prerequisite_course_id?: number | null;
  prerequisite_description?: string;
  created_at: string;
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
  materials?: any[];
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
