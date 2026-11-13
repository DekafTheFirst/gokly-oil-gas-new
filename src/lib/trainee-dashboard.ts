import { apiFetch } from "./api";
import { getAuthToken } from "./auth";
import type { ModuleMaterial } from "../components/educert/ModuleMaterials";

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
  registration_start_date: string | null;
  registration_end_date: string | null;
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

export interface TraineeTrainingCourse {
  id: number;
  title: string;
  code: string | null;
  category: string | null;
  description: string | null;
  short_description: string | null;
  tier: string | null;
  duration_value: number | null;
  duration_unit: string | null;
  delivery_mode: string | null;
  status: string | null;
  certificate_enabled: boolean | null;
  certificate_external: boolean | null;
  certificate_authority: string | null;
  certificate_license_id: string | null;
  certificate_portal_url: string | null;
  thumbnail_url: string | null;
  price: string | null;
  currency: string | null;
}

export interface TraineeTrainingBatch {
  id: string;
  name: string;
  batch_code: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  capacity: number | null;
  registration_start_date: string | null;
  registration_end_date: string | null;
  status: string | null;
  delivery_mode: string | null;
}

export interface TraineeTrainingEnrollment {
  enrollment_id: number | null;
  enrollment_number: string | null;
  status: string | null;
  source_type: string | null;
  origin: "ENROLLMENT" | "LEGACY" | "PAYMENT";
  enrolled_at: string | null;
  completed_at: string | null;
  completion_percentage: number;
  final_score: number | null;
  training_status: "ACTIVE" | "UPCOMING" | "COMPLETED" | "CANCELLED" | "PENDING_PAYMENT";
  batch: TraineeTrainingBatch | null;
  sponsor: { name: string; email: string | null; phone: string | null } | null;
  engagement: { title: string | null; reference_number: string | null } | null;
  trainee: { trainee_number: string | null; occupation: string | null; photo_url: string | null } | null;
  pending_payment: {
    amount_kobo: number;
    reference: string | null;
    method: "CARD" | "BANK_TRANSFER" | null;
  } | null;
  paid_payment: {
    amount: string;
    currency: string | null;
    payment_method: string | null;
    transaction_reference: string | null;
    payment_date: string | null;
  } | null;
}

export interface TraineeTrainingModule {
  id: number;
  title: string;
  description: string | null;
  scheduled_date: string | null;
  duration: number | null;
  has_assessment: boolean | null;
  assessment_type: string | null;
  assessment_max_score: number | null;
  assessment_pass_mark: number | null;
  sort_order: number;
  is_required: boolean | null;
  progress_status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | null;
  progress_percentage: string | number | null;
  progress_completed_at: string | null;
  assessment_score: string | number | null;
  assessment_passed: boolean | null;
  assessment_graded_at: string | null;
  materials?: ModuleMaterial[] | null;
}

export interface TraineeTrainingSession {
  id: string;
  title: string;
  description: string | null;
  session_date: string;
  start_time: string;
  end_time: string;
  delivery_mode: string | null;
  location: string | null;
  online_url: string | null;
  qualification: string | null;
  specialization: string | null;
  trainer_name: string | null;
  attendance_status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | null;
  check_in_at: string | null;
}

export interface TraineeTrainingAssessment {
  id: string;
  title: string;
  description: string | null;
  type: "THEORY" | "PRACTICAL" | "FINAL" | "OTHER";
  max_score: string | number;
  pass_mark: string | number;
  is_required: boolean;
  score: string | number | null;
  percentage: string | number | null;
  result: "PASS" | "FAIL" | "PENDING" | null;
  graded_at: string | null;
}

export interface TraineeTrainingCertificate {
  certificate_number: string;
  verification_code: string | null;
  issued_at: string | null;
  expires_at: string | null;
  status: string;
  pdf_url: string | null;
}

export interface TraineeTrainingDetail {
  course: TraineeTrainingCourse;
  enrollment: TraineeTrainingEnrollment;
  modules: TraineeTrainingModule[];
  sessions: TraineeTrainingSession[];
  assessments: TraineeTrainingAssessment[];
  certificates: TraineeTrainingCertificate[];
}

export async function fetchTraineeTrainingDetail(courseId: number): Promise<TraineeTrainingDetail> {
  const token = getAuthToken();
  return apiFetch(`/courses/my-training/${courseId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
