import { apiFetch } from "./api";
import { getAuthToken } from "./auth";

export interface CourseRecord {
  id: number;
  title: string;
  category: string;
  description: string;
  tier: string;
  hours: string;
  image?: string | null;
  created_at: string;
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

export default { fetchCourses, fetchAdminCourses, createCourse, enrollInCourse };
