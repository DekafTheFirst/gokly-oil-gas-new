/**
 * Module-material uploads.
 *
 * Materials (PDF, slides, spreadsheets, video) are held as local `File`s in the
 * wizard and uploaded to Cloudinary (via the authenticated `/upload/material`
 * endpoint) only when the course is saved. Materials that already carry a
 * Cloudinary reference — e.g. loaded when editing an existing course — are never
 * re-uploaded.
 */
import { API_BASE_URL } from "./api";
import { getAuthToken } from "./auth";
import type { CourseModule } from "./courses";

export interface MaterialReference {
  name: string;
  size: number;
  type: string;
  url: string;
  publicId: string;
  resourceType: string;
}

interface MaterialUploadResponse {
  url?: string;
  secureUrl?: string;
  publicId?: string;
  resourceType?: string;
  name?: string;
  size?: number;
  type?: string;
  error?: string;
}

/** Upload one material file and return the metadata stored on the module. */
export const uploadMaterialFile = async (file: File): Promise<MaterialReference> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Your session has expired — sign in again and retry.");
  }

  const body = new FormData();
  body.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload/material`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });

  const data: MaterialUploadResponse = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || `Upload failed (HTTP ${response.status})`);
  }

  const url = data.url || data.secureUrl;
  if (!url) {
    throw new Error("Upload succeeded but no URL was returned.");
  }

  return {
    name: data.name || file.name,
    size: data.size ?? file.size,
    type: data.type || file.type,
    url,
    publicId: data.publicId || "",
    resourceType: data.resourceType || "raw",
  };
};

/**
 * A module material as held in the wizard: either an already-uploaded Cloudinary
 * reference, or a freshly-picked local file awaiting upload at submit time.
 */
export interface MaterialDraft {
  name: string;
  size?: number;
  type?: string;
  url?: string | null;
  publicId?: string | null;
  resourceType?: string | null;
  /** Present only for files picked this session; stripped before saving. */
  file?: File | null;
  [key: string]: unknown;
}

/**
 * Resolve every module's materials just before a course is saved.
 *
 * - A material that already carries a Cloudinary `url`/`publicId` (e.g. loaded
 *   when editing an existing course) is passed through untouched — it is never
 *   re-uploaded.
 * - A material holding a freshly-picked `file` is uploaded now, once.
 * - The transient `file` handle is stripped from the result, so the payload sent
 *   to the API contains only serialisable Cloudinary references.
 */
export const resolveModuleMaterials = async (
  modules: CourseModule[],
  onProgress?: (done: number, total: number) => void,
): Promise<CourseModule[]> => {
  if (!Array.isArray(modules)) return modules;

  const draftsFor = (module: CourseModule): MaterialDraft[] =>
    Array.isArray(module.materials) ? (module.materials as MaterialDraft[]) : [];

  const total = modules.reduce(
    (sum, module) =>
      sum +
      draftsFor(module).filter((material) =>
        Boolean(material?.file && !material.url && !material.publicId),
      ).length,
    0,
  );
  if (total > 0) onProgress?.(0, total);

  let done = 0;
  const resolved: CourseModule[] = [];

  for (const module of modules) {
    const materials: MaterialDraft[] = [];
    for (const material of draftsFor(module)) {
      if (!material) continue;
      const { name, size, type, url, publicId, resourceType } = material;

      // Already in Cloudinary, or nothing to upload → keep as-is minus the File.
      if (url || publicId || !material.file) {
        materials.push({ name, size, type, url, publicId, resourceType });
        continue;
      }

      const uploaded = await uploadMaterialFile(material.file);
      done += 1;
      onProgress?.(done, total);
      materials.push({
        ...uploaded,
        size: uploaded.size ?? size,
        type: uploaded.type || type,
      });
    }
    resolved.push({ ...module, materials });
  }

  return resolved;
};
