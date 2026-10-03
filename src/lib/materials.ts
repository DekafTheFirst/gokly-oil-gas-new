/**
 * Single-request course submission.
 *
 * The wizard never uploads on its own any more: it packs the course payload,
 * the cover image and every pending material into one `FormData` and posts it
 * in a single request. The API validates the course *before* touching any file,
 * so an invalid course costs zero uploads; individual upload failures are
 * reported back instead of aborting the save.
 */
import { API_BASE_URL } from "./api";
import { getAuthToken } from "./auth";
import type { CourseModule, CourseRecord } from "./courses";

export interface MaterialDraft {
  name: string;
  size?: number;
  type?: string;
  url?: string | null;
  publicId?: string | null;
  resourceType?: string | null;
  /** Present only for files picked this session; never serialised. */
  file?: File | null;
  /** Assigned during submission so the API can match a file to its slot. */
  fileKey?: string;
  [key: string]: unknown;
}

export interface MaterialUploadFailure {
  field: string;
  name: string;
  error: string;
}

export interface CourseUploadReport {
  succeeded: Array<{ field: string; name: string; url: string }>;
  failed: MaterialUploadFailure[];
}

export interface CourseSubmissionResult {
  course?: CourseRecord;
  uploads?: CourseUploadReport;
}

/** Multipart field holding the cover image. */
export const THUMBNAIL_FIELD = "thumbnail";

/**
 * Pack a course into the multipart body the API expects.
 *
 * Materials already stored in Cloudinary (no `file`) are left untouched, so
 * editing a course never re-uploads what it already has.
 */
export const buildCourseFormData = (
  payload: Record<string, unknown>,
  options: { thumbnailFile?: File | null; modules?: CourseModule[] } = {},
): FormData => {
  const form = new FormData();
  const body = { ...payload };

  // Give each freshly-picked material a key, then drop the File handle so the
  // JSON stays serialisable.
  const pending: Array<{ key: string; file: File }> = [];
  for (const module of options.modules || []) {
    for (const material of (module.materials || []) as MaterialDraft[]) {
      if (!material || typeof material !== "object") continue;
      if (material.url || material.publicId || !material.file) continue;
      const key = `m${pending.length}`;
      pending.push({ key, file: material.file });
      material.fileKey = key;
      delete material.file;
    }
  }
  body.modules = options.modules || [];

  form.append("payload", JSON.stringify(body));

  if (options.thumbnailFile) {
    form.append(THUMBNAIL_FIELD, options.thumbnailFile, options.thumbnailFile.name);
  }
  for (const { key, file } of pending) {
    form.append(key, file, file.name);
  }

  return form;
};

/** POST/PUT a packed submission and surface both the record and the report. */
export const submitCourseForm = async (
  path: string,
  payload: Record<string, unknown>,
  options: { method?: "POST" | "PUT"; thumbnailFile?: File | null; modules?: CourseModule[] } = {},
): Promise<CourseSubmissionResult> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Your session has expired — sign in again and retry.");
  }

  const form = buildCourseFormData(payload, options);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Save failed (HTTP ${response.status})`);
  }
  return data as CourseSubmissionResult;
};

/** Human-readable summary of uploads the API could not store. */
export const describeUploadFailures = (report?: CourseUploadReport): string => {
  if (!report || !report.failed?.length) return "";
  return report.failed.map((failure) => `${failure.name} (${failure.error})`).join(", ");
};