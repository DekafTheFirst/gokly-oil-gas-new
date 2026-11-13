import { apiFetch } from "./api";
import { getAuthToken } from "./auth";

export interface AdminWaitlistEntry {
  id: string;
  course_id: number;
  course_title: string;
  course_code?: string | null;
  ticket_number: string;
  full_name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  timeframe: string | null;
  notes: string | null;
  status: string;
  notified_at: string | null;
  created_at: string;
}

export interface AdminWaitlistCourseOption {
  id: number;
  title: string;
}

export interface AdminWaitlistStatusCount {
  status: string;
  count: number;
}

export interface AdminWaitlistPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  from: number;
  to: number;
}

const authHeaders = () => {
  const token = getAuthToken();
  if (!token) throw new Error("Your session has expired. Please sign in again.");
  return { Authorization: `Bearer ${token}` };
};

export async function fetchAdminWaitlist(
  page = 1,
  limit = 15,
  search = "",
  courseId = "",
  status = "",
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search,
  });
  if (courseId) params.set("course_id", courseId);
  if (status) params.set("status", status);
  return apiFetch(`/courses/admin/waitlist?${params}`, {
    headers: authHeaders(),
  }) as Promise<{
    entries: AdminWaitlistEntry[];
    pagination: AdminWaitlistPagination;
    filter_options: {
      courses: AdminWaitlistCourseOption[];
      status_counts: AdminWaitlistStatusCount[];
    };
  }>;
}
