export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export class ApiError extends Error {
  errors: Array<{ field?: string; message?: string }>;

  constructor(message: string, errors: Array<{ field?: string; message?: string }> = []) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers({ "Content-Type": "application/json" });
  new Headers(options.headers).forEach((value, key) => headers.set(key, value));
  const response = await fetch(url, {
    headers,
    credentials: options.credentials || "omit",
    method: options.method || "GET",
    body: options.body == null ? undefined : JSON.stringify(options.body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = data?.error || response.statusText || "Request failed.";
    throw new ApiError(error, Array.isArray(data?.errors) ? data.errors : []);
  }

  return data;
}
