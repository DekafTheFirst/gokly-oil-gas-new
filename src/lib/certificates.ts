// Certificate management API service
import { apiFetch } from "./api";
import { getAuthToken } from "./auth";

export interface Certificate {
  id: number;
  certificate_number: string;
  user_id: number;
  course_id: number;
  trainer_id: number;
  issued_at: string;
  status: 'active' | 'revoked';
  revoked_at?: string;
  revoke_reason?: string;
  revoked_by?: number;
  student_name: string;
  course_title: string;
  trainer_name: string;
}

export interface CertificateUploadRow {
  name: string;
  course: string;
  phone_number: string;
  email: string;
}

export interface CertificateBatch {
  id: number;
  created_by: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  zip_path?: string;
  created_at: string;
  updated_at: string;
  jobs?: Array<{
    id: number;
    name: string;
    course: string;
    phone_number: string;
    email: string;
    status: string;
    certificate_number?: string;
    error?: string;
  }>;
}

export interface BulkUploadResult {
  success?: boolean;
  message?: string;
  error?: string;
  batch?: CertificateBatch;
  certificates_created?: number;
  errors?: string[];
}

// Get all certificates for admin management
export const fetchAllCertificates = async (): Promise<Certificate[]> => {
  const token = getAuthToken();
  const data = await apiFetch("/certificates/admin/all", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.certificates || [];
};

// Revoke a certificate
export const revokeCertificate = async (certificateId: number, reason: string): Promise<void> => {
  const token = getAuthToken();
  await apiFetch(`/certificates/${certificateId}/revoke`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: { reason },
  });
};

// Unrevoke (restore) a certificate
export const unrevokeCertificate = async (certificateId: number): Promise<void> => {
  const token = getAuthToken();
  await apiFetch(`/certificates/${certificateId}/unrevoke`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Bulk upload certificates from parsed rows
export const bulkUploadCertificates = async (
  rows: CertificateUploadRow[]
): Promise<CertificateBatch> => {
  const token = getAuthToken();
  const result = await apiFetch("/certificates/import", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: { rows },
  });
  return result.batch;
};

// Get batch status and details
export const getBatchStatus = async (batchId: number): Promise<CertificateBatch> => {
  const token = getAuthToken();
  const data = await apiFetch(`/certificates/batches/${batchId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.batch;
};

// Download bulk upload template
export const downloadCertificateTemplate = (): void => {
  const csvContent = "Name,Course,Phone Number,Email\nJohn Doe,FIFTY PIPE FITTERS IN RIVERS STATE,123-456-7890,john.doe@example.com\n";
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'certificate_bulk_upload_template.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};

// Verify certificate (public endpoint)
export const verifyCertificate = async (certificateNumber: string): Promise<any> => {
  return await apiFetch(`/certificates/verify/${certificateNumber}`);
};

// Download batch ZIP
export const downloadBatchZip = async (batchId: number): Promise<void> => {
  const token = getAuthToken();
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
  const response = await fetch(`${baseUrl}/certificates/batches/${batchId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to download batch");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `certificate-batch-${batchId}.zip`;
  a.click();
  window.URL.revokeObjectURL(url);
};