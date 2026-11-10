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
  training_status: "ACTIVE" | "UPCOMING" | "COMPLETED" | "CANCELLED" | "PENDING_PAYMENT";
  source_type: string | null;
  sponsor_name: string | null;
  pending_amount_kobo: number | string | null;
  payment_reference: string | null;
  pending_payment_method: "CARD" | "BANK_TRANSFER" | null;
  course_price: string | null;
  currency: string | null;
  batch_name: string | null;
  batch_code: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  batch_status: string | null;
  completion_percentage: number;
  total_modules: number;
  completed_modules: number;
  attendance_records: number;
  attended_records: number;
  active_certificates: number;
  latest_certificate_number: string | null;
  paid_amount: string | null;
  paid_currency: string | null;
  paid_payment_method: string | null;
  paid_payment_reference: string | null;
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
