export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export class ApiError extends Error {
  errors: Array<{ field?: string; message?: string }>;
  code?: string;
  retryVerification: boolean;

  constructor(
    message: string,
    errors: Array<{ field?: string; message?: string }> = [],
    code?: string,
    retryVerification = false,
  ) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
    this.code = code;
    this.retryVerification = retryVerification;
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
    throw new ApiError(
      error,
      Array.isArray(data?.errors) ? data.errors : [],
      data?.code,
      data?.retryVerification === true,
    );
  }

  return data;
}
