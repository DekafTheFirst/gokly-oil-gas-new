import { apiFetch } from "./api";
import { getAuthToken } from "./auth";

export interface TraineeDashboardCourse {
  enrollment_id: number | null;
  course_id: number;
  title: string;
  code: string | null;
  category: string;
  delivery_mode: string | null;
  duration_value: number | null;
  duration_unit: string | null;
  enrolled_at: string | null;
  enrollment_status: string | null;
  completed_at: string | null;
  batch_name: string | null;
  batch_code: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  completion_percentage: number;
  total_modules: number;
  completed_modules: number;
  attendance_records: number;
  attended_records: number;
  active_certificates: number;
  latest_certificate_number: string | null;
}

export interface TraineeDashboardSummary {
  courses: TraineeDashboardCourse[];
  active_certificates: number;
  trainee_number: string | null;
}

export async function fetchTraineeDashboard(): Promise<TraineeDashboardSummary> {
  const token = getAuthToken();
  return apiFetch("/courses/dashboard/summary", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
