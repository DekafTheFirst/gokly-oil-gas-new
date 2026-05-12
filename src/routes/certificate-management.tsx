import { useState, useEffect } from "react";
import { ShieldCheck, AlertTriangle, Download, Upload, X, CheckCircle, XCircle, Eye, RefreshCw } from "lucide-react";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  fetchAllCertificates,
  revokeCertificate,
  unrevokeCertificate,
  bulkUploadCertificates,
  getBatchStatus,
  downloadBatchZip,
  downloadCertificateTemplate,
  type Certificate,
  type CertificateUploadRow,
  type CertificateBatch,
  type BulkUploadResult,
  type CertificateResponse,
  type CertificatePagination,
} from "@/lib/certificates";

export default function CertificateManagement() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [unrevokingId, setUnrevokingId] = useState<number | null>(null);
  const [pagination, setPagination] = useState<CertificatePagination | null>(null);

  // Bulk upload states
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [parsedRows, setParsedRows] = useState<CertificateUploadRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentBatch, setCurrentBatch] = useState<CertificateBatch | null>(null);
  const [batchPolling, setBatchPolling] = useState(false);
  const rowsPerPage = 10;

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'revoked'>('all');
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCertificates(1, searchTerm, statusFilter);
  }, []);

  useEffect(() => {
    if (!currentBatch || currentBatch.status === 'completed' || currentBatch.status === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const updated = await getBatchStatus(currentBatch.id);
        setCurrentBatch(updated);
      } catch (err) {
        console.error('Batch polling error:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentBatch]);

  const fetchCertificates = async (page: number = 1, search: string = "", status: string = "all") => {
    try {
      setLoading(true);
      const response: CertificateResponse = await fetchAllCertificates(page, rowsPerPage, search, status);
      setCertificates(response.certificates);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeCertificate = async (certificateId: number, reason: string) => {
    try {
      setRevokingId(certificateId);
      await revokeCertificate(certificateId, reason);
      setSuccessMessage("Certificate revoked successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchCertificates(currentPage, searchTerm, statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke certificate");
      setTimeout(() => setError(""), 3000);
    } finally {
      setRevokingId(null);
    }
  };

  const handleUnrevokeCertificate = async (certificateId: number) => {
    try {
      setUnrevokingId(certificateId);
      await unrevokeCertificate(certificateId);
      setSuccessMessage("Certificate restored successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchCertificates(currentPage, searchTerm, statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore certificate");
      setTimeout(() => setError(""), 3000);
    } finally {
      setUnrevokingId(null);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    fetchCertificates(1, value, statusFilter);
  };

  const handleStatusFilterChange = (value: 'all' | 'active' | 'revoked') => {
    setStatusFilter(value);
    fetchCertificates(1, searchTerm, value);
  };

  const handlePageChange = (page: number) => {
    fetchCertificates(page, searchTerm, statusFilter);
  };

  const normalizeKey = (key: string) => key.trim().toLowerCase().replace(/\s+/g, "_");

  const mapUploadRow = (rawRow: Record<string, unknown>): CertificateUploadRow => {
    const mapped: CertificateUploadRow = {
      name: "",
      course: "",
      phone_number: "",
      email: "",
    };

    for (const [key, value] of Object.entries(rawRow)) {
      const normalized = normalizeKey(key);
      const textValue = value == null ? "" : String(value).trim();

      if (normalized === "name" || normalized === "full_name") {
        mapped.name = textValue;
      } else if (normalized === "course" || normalized === "course_name") {
        mapped.course = textValue;
      } else if (normalized === "phone_number" || normalized === "phone" || normalized === "phone_no" || normalized === "phone number") {
        mapped.phone_number = textValue;
      } else if (normalized === "email") {
        mapped.email = textValue;
      }
    }

    return mapped;
  };

  const parseFileToRows = async (file: File) => {
    setError("");
    setParseErrors([]);
    setParsedRows([]);
    setCurrentPage(1);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const XLSX = await import("xlsx");
      let workbook;

      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = new TextDecoder().decode(arrayBuffer);
        workbook = XLSX.read(text, { type: "string" });
      } else {
        workbook = XLSX.read(arrayBuffer, { type: "array" });
      }

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error("No worksheet found in the file.");

      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const rows = rawRows.map(mapUploadRow);

      if (rows.length === 0) {
        throw new Error("No data found in the selected file.");
      }

      setParsedRows(rows);
    } catch (err) {
      setParseErrors([err instanceof Error ? err.message : "Unable to parse the selected file."]);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedRows.length === 0) {
      setError("Please select a valid file and verify the preview before uploading.");
      return;
    }

    try {
      setUploading(true);
      const batch = await bulkUploadCertificates(parsedRows);
      setCurrentBatch(batch);
      setBulkFile(null);
      setParsedRows([]);
      setCurrentPage(1);
      setUploadResult(null);
      setSuccessMessage("Batch submitted! Processing certificates...");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setUploadResult({
        error: err instanceof Error ? err.message : "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(parsedRows.length / rowsPerPage));
  const paginatedRows = parsedRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const showingFrom = parsedRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const showingTo = Math.min(parsedRows.length, currentPage * rowsPerPage);

  const downloadTemplate = () => {
    downloadCertificateTemplate();
  };

  return (
    <AdminPageShell withSidebar searchPlaceholder="Search certificates...">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">Certificate Management</h1>
          <p className="mt-2 text-muted-foreground">Manage certificates, bulk issuance, and revocation tracking.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4" /> Template
          </Button>
          <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4" /> Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-none w-auto">
              <DialogHeader>
                <DialogTitle>Bulk Certificate Upload</DialogTitle>
                <DialogDescription>
                  Upload a CSV or Excel file to issue multiple certificates at once.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleBulkUpload} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    className="cursor-pointer"
                    id="file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={async (e) => {
                      const file = e.target.files?.[0] || null;
                      setBulkFile(file);
                      if (file) {
                        await parseFileToRows(file);
                      } else {
                        setParsedRows([]);
                        setParseErrors([]);
                        setCurrentPage(1);
                      }
                    }}
                    disabled={uploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported formats: CSV, Excel (.xlsx, .xls)
                  </p>
                </div>

                {parseErrors.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                    <p className="font-semibold">Unable to parse file</p>
                    <ul className="mt-2 list-disc list-inside">
                      {parseErrors.map((message, index) => (
                        <li key={index}>{message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {parsedRows.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">Preview rows</p>
                        <p className="text-xs text-muted-foreground">
                          Showing {showingFrom}-{showingTo} of {parsedRows.length} rows
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        >
                          Previous
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full table-fixed text-left text-xs">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="w-12 px-2 py-2 text-slate-600">S/N</th>
                            <th className="w-80 px-2 py-2 text-slate-600">Name</th>
                            <th className="w-72 px-2 py-2 text-slate-600">Course</th>
                            <th className="w-48 px-2 py-2 text-slate-600">Phone Number</th>
                            <th className="w-64 px-2 py-2 text-slate-600">Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="odd:bg-white even:bg-slate-100">
                              <td className="px-2 py-3 align-top">{showingFrom + rowIndex}</td>
                              <td className="px-2 py-3 align-top">{row.name}</td>
                              <td className="px-2 py-3 align-top">{row.course}</td>
                              <td className="px-2 py-3 align-top">{row.phone_number}</td>
                              <td className="px-2 py-3 align-top">{row.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {uploadResult && (
                  <div className={`rounded-lg p-4 ${uploadResult.error ? 'bg-red-50' : 'bg-blue-50'}`}>
                    <p className={`font-semibold ${uploadResult.error ? 'text-red-900' : 'text-blue-900'}`}>
                      {uploadResult.error || "Error"}
                    </p>
                  </div>
                )}

                {currentBatch && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Batch Processing</p>
                        <p className="text-xs text-blue-700 mt-1">
                          {currentBatch.completed_jobs}/{currentBatch.total_jobs} completed
                          {currentBatch.failed_jobs > 0 && `, ${currentBatch.failed_jobs} failed`}
                        </p>
                      </div>
                      <Badge
                        variant={
                          currentBatch.status === 'completed'
                            ? 'default'
                            : currentBatch.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {currentBatch.status}
                      </Badge>
                    </div>
                    <div className="h-2 rounded-full bg-blue-200 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{
                          width: `${(currentBatch.completed_jobs / currentBatch.total_jobs) * 100}%`,
                        }}
                      />
                    </div>
                    {currentBatch.status === 'completed' && currentBatch.zip_path && (
                      <Button
                        className="mt-4"
                        onClick={() => downloadBatchZip(currentBatch.id)}
                      >
                        <Download className="h-4 w-4 mr-2" /> Download ZIP
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={!bulkFile || uploading || currentBatch?.status === 'processing'}
                    className="flex-1"
                  >
                    {uploading ? "Uploading..." : currentBatch?.status === 'processing' ? "Processing..." : "Upload & Generate"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowBulkUpload(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mt-6 flex items-center gap-3 rounded-lg bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Filters */}
      <div className="mt-8 flex flex-wrap gap-4">
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilterChange('all')}
          >
            All ({certificates.length})
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilterChange('active')}
          >
            Active ({certificates.filter(c => c.status === 'active').length})
          </Button>
          <Button
            variant={statusFilter === 'revoked' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilterChange('revoked')}
          >
            Revoked ({certificates.filter(c => c.status === 'revoked').length})
          </Button>
        </div>
        <Input
          placeholder="Search certificates..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Certificates Table */}
      <div className="mt-6 rounded-2xl bg-card shadow-[var(--shadow-card)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Loading certificates...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-8 text-center">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No certificates found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Certificate #</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Course</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Trainer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Issued</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 text-sm font-mono">{cert.certificate_number}</td>
                    <td className="px-6 py-4 text-sm">{cert.student_name}</td>
                    <td className="px-6 py-4 text-sm">{cert.course_title}</td>
                    <td className="px-6 py-4 text-sm">{cert.trainer_name}</td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(cert.issued_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={cert.status === 'active' ? 'default' : 'destructive'}>
                        {cert.status === 'active' ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Revoked</>
                        )}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/public-verification?cert=${cert.certificate_number}`, '_blank')}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>

                        {cert.status === 'active' ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" disabled={revokingId === cert.id}>
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Revoke Certificate</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently revoke certificate {cert.certificate_number}.
                                  The student will no longer be able to verify this certificate.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="revoke-reason">Reason for revocation</Label>
                                  <Input
                                    id="revoke-reason"
                                    placeholder="e.g., Academic misconduct, error in issuance..."
                                  />
                                </div>
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    const reason = (document.getElementById('revoke-reason') as HTMLInputElement)?.value || 'No reason provided';
                                    handleRevokeCertificate(cert.id, reason);
                                  }}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Revoke Certificate
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnrevokeCertificate(cert.id)}
                            disabled={unrevokingId === cert.id}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-muted/50 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {pagination.from} to {pagination.to} of {pagination.total} certificates
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i;
                  if (pageNum > pagination.totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}