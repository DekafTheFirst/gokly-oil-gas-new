/**
 * Course-wizard submission helpers.
 *
 * Creating a course is now a single unified endpoint that handles:
 * course data, modules, final assessment, and image upload in one transaction.
 */
import { apiFetch, API_BASE_URL } from "./api";
import { getAuthToken } from "./auth";
import type { CourseModule } from "./courses";

/**
 * Wizard state with no matching `courses` column (Step 4/5 training-management
 * and certificate-design fields). Sent nowhere until those columns land — the
 * API whitelists its own insert anyway, but stripping keeps the request honest.
 */
const WIZARD_ONLY_KEYS = [
  "certificate_title",
  "certificate_template",
  "certificate_issuance_mode",
  "certificate_validity_framework",
  "certificate_validity_duration",
  "certificate_validity_unit",
  "certificate_id_prefix",
  "certificate_id_separator",
  "certificate_id_year_schema",
  "certificate_id_sequence_type",
  "attendance_required",
  "attendance_percentage",
  "strict_attendance",
  "minimum_contact_hours",
  "module_completion_mode",
  "assessment_required",
  "theory_passing_score",
  "practical_required",
  "sequential_progression",
  "expandedModules",
  "assessments",
  "thumbnail_file",
] as const;

export interface FinalAssessmentInput {
  name: string;
  description?: string;
  type: string;
  max_score: number;
  /** Collected as a percentage of `max_score` in the wizard. */
  pass_mark: number;
  required?: boolean;
}

export interface FinalAssessmentPayload {
  title: string;
  description: string;
  type: string;
  max_score: number;
  /** Absolute marks — the `assessments` table stores numbers, not percents. */
  pass_mark: number;
  is_required: boolean;
}

/** Module-level assessment config has no table yet, so only the flag persists. */
export interface ModulePayload {
  name: string;
  description: string;
  scheduled_date: string | null;
  has_assessment: boolean;
  sort_order: number;
}

const ASSESSMENT_TYPE_MAP: Record<string, string> = {
  written: "THEORY",
  mcq: "THEORY",
  practical: "PRACTICAL",
  oral: "OTHER",
  trainer: "OTHER",
  other: "OTHER",
  final: "FINAL",
};

export const toFinalAssessmentPayload = (
  assessment: FinalAssessmentInput,
): FinalAssessmentPayload => {
  const maxScore = Number(assessment.max_score) || 0;
  const percent = Number(assessment.pass_mark) || 0;
  return {
    title: (assessment.name ?? "").trim(),
    description: (assessment.description ?? "").trim(),
    type: ASSESSMENT_TYPE_MAP[assessment.type] ?? "FINAL",
    max_score: maxScore,
    // NUMERIC(7,2) column — round so the API never receives float noise.
    pass_mark: Math.round(((maxScore * percent) / 100) * 100) / 100,
    is_required: assessment.required !== false,
  };
};

export const toModulePayloads = (modules: CourseModule[]): ModulePayload[] =>
  modules.map((module, index) => ({
    name: (module.name ?? "").trim(),
    description: (module.description ?? "").trim(),
    // The wizard keeps "no date" as "" — forwarding that would reach Postgres as
    // an invalid timestamp, so it is normalised to null (the column became
    // optional in migrations/make-module-schedule-optional.js).
    scheduled_date: module.scheduled_date ? module.scheduled_date : null,
    has_assessment: Boolean(module.has_assessment),
    sort_order: Number.isInteger(module.sort_order) ? (module.sort_order as number) : index,
  }));

/**
 * Project the wizard state onto the columns `POST /courses` actually inserts,
 * applying the conditional rules the backend expects.
 */
export const buildCoursePayload = <T extends object>(
  formData: T,
  thumbnailBase64: string | null,
): Record<string, unknown> => {
  const source = formData as unknown as Record<string, unknown>;
  const payload: Record<string, unknown> = { ...source };
  for (const key of WIZARD_ONLY_KEYS) delete payload[key];

  // External linkage only ships when issuance is ON *and* external mode is on —
  // otherwise the backend's "authority + license ID" guard rejects the course.
  const externalOn = Boolean(source.certificate_enabled && source.certificate_external);
  payload.thumbnail_base64 = thumbnailBase64 || null;
  payload.certificate_external = externalOn;
  payload.certificate_authority = externalOn ? source.certificate_authority : null;
  payload.certificate_license_id = externalOn ? source.certificate_license_id : null;
  payload.certificate_portal_url = externalOn ? source.certificate_portal_url || null : null;
  payload.prerequisite_type = source.prerequisite_required ? source.prerequisite_type : null;
  payload.prerequisite_course_id =
    source.prerequisite_required && source.prerequisite_type === "internal"
      ? source.prerequisite_course_id
      : null;
  
  // Include modules in the payload for the unified endpoint
  if (source.modules && Array.isArray(source.modules)) {
    payload.modules = toModulePayloads(source.modules as CourseModule[]);
  }
  
  // Include final assessment if present
  if (source.has_final_assessment && source.final_assessment) {
    payload.has_final_assessment = true;
    payload.final_assessment = source.final_assessment;
  }
  
  return payload;
};

/** Auth header for raw `fetch` calls; fails loudly instead of sending `null`. */
export const authHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Your session has expired — sign in again and retry.");
  }
  return { Authorization: `Bearer ${token}` };
};

/** Resolve an `/assets/...` upload path against the API origin (not `/api`). */
export const absoluteAssetUrl = (path: string): string => {
  if (/^(https?:)?\/\//i.test(path)) return path;
  const origin = /^[a-z][a-z0-9+.-]*:\/\//i.test(API_BASE_URL)
    ? new URL(API_BASE_URL).origin
    : "";
  return `${origin}${path}`;
};

/** Pull the server's `error` string out of a failed response, if present. */
export const readApiError = async (response: Response, fallback: string): Promise<string> => {
  try {
    const body = await response.json();
    if (body && typeof body.error === "string") return body.error;
  } catch {
    // Non-JSON body (proxy 502, HTML error page) — fall back below.
  }
  return `${fallback} (HTTP ${response.status})`;
};

/** Convert a file to base64 string for upload */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


