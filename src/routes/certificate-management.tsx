import { useState, useEffect } from "react";
import { ShieldCheck, AlertTriangle, Download, Upload, CheckCircle, XCircle, Eye, RefreshCw, Search } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  type CertificateStatusCounts,
} from "@/lib/certificates";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const EMPTY_COUNTS: CertificateStatusCounts = { all: 0, active: 0, revoked: 0 };

export default function CertificateManagement() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [unrevokingId, setUnrevokingId] = useState<number | null>(null);
  const [pagination, setPagination] = useState<CertificatePagination | null>(null);
  const [counts, setCounts] = useState<CertificateStatusCounts>(EMPTY_COUNTS);
  const [pageSize, setPageSize] = useState(10);

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

  const fetchCertificates = async (page: number = 1, search: string = "", status: string = "all", size?: number) => {
    try {
      setLoading(true);
      const limit = size ?? pageSize;
      const response: CertificateResponse = await fetchAllCertificates(page, limit, search, status);
      setCertificates(response.certificates);
      setPagination(response.pagination);
      // Tab badges come from the server so they stay stable while switching tabs
      // and still reflect the active search term.
      setCounts(response.counts ?? EMPTY_COUNTS);
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
      fetchCertificates(currentPage, searchTerm, statusFilter, pageSize);
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
      fetchCertificates(currentPage, searchTerm, statusFilter, pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore certificate");
      setTimeout(() => setError(""), 3000);
    } finally {
      setUnrevokingId(null);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    fetchCertificates(1, value, statusFilter, pageSize);
  };

  const handleStatusFilterChange = (value: 'all' | 'active' | 'revoked') => {
    setStatusFilter(value);
    fetchCertificates(1, searchTerm, value, pageSize);
  };

  const handlePageChange = (page: number) => {
    fetchCertificates(page, searchTerm, statusFilter, pageSize);
  };

  const handlePageSizeChange = (value: string) => {
    const nextSize = Number(value);
    if (!Number.isFinite(nextSize) || nextSize <= 0) {
      return;
    }
    setPageSize(nextSize);
    fetchCertificates(1, searchTerm, statusFilter, nextSize);
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
      <div className="page-padding">
        <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Certificate Management</h1>
          <p className="admin-page-subtitle">Manage certificates, bulk issuance, and revocation tracking.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4" /> Template
          </Button>
          <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4" /> Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Bulk Certificate Upload</DialogTitle>
                <DialogDescription>
                  Upload a CSV or Excel file to issue multiple certificates at once.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleBulkUpload} className="grid gap-5">
                <div className="admin-dialog-section grid gap-2">
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
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                    <p className="font-semibold">Unable to parse file</p>
                    <ul className="mt-2 list-inside list-disc">
                      {parseErrors.map((message, index) => (
                        <li key={index}>{message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {parsedRows.length > 0 && (
                  <div className="admin-dialog-section">
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
                    <div className="overflow-x-auto rounded-lg border border-border/70 bg-background">
                      <table className="admin-table table-fixed">
                        <thead>
                          <tr>
                            <th className="w-12">S/N</th>
                            <th className="w-80">Name</th>
                            <th className="w-72">Course</th>
                            <th className="w-48">Phone Number</th>
                            <th className="w-64">Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              <td className="align-top text-muted-foreground">{showingFrom + rowIndex}</td>
                              <td className="align-top font-medium text-foreground">{row.name}</td>
                              <td className="align-top text-muted-foreground">{row.course}</td>
                              <td className="align-top text-muted-foreground">{row.phone_number}</td>
                              <td className="align-top text-muted-foreground">{row.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {uploadResult && (
                  <div className={`rounded-xl border p-4 text-sm ${uploadResult.error ? 'border-destructive/20 bg-destructive/5 text-destructive' : 'border-border/70 bg-muted/30 text-foreground'}`}>
                    <p className="font-medium">{uploadResult.error || "Error"}</p>
                  </div>
                )}

                {currentBatch && (
                  <div className="admin-dialog-section">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Batch processing</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {currentBatch.completed_jobs}/{currentBatch.total_jobs} completed
                          {currentBatch.failed_jobs > 0 && `, ${currentBatch.failed_jobs} failed`}
                        </p>
                      </div>
                      <Badge
                        variant={
                          currentBatch.status === 'completed'
                            ? 'success'
                            : currentBatch.status === 'failed'
                              ? 'destructive'
                              : 'warning'
                        }
                      >
                        {currentBatch.status}
                      </Badge>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{
                          width: `${(currentBatch.completed_jobs / currentBatch.total_jobs) * 100}%`,
                        }}
                      />
                    </div>
                    {currentBatch.status === 'completed' && currentBatch.zip_path && (
                      <Button className="mt-4" onClick={() => downloadBatchZip(currentBatch.id)}>
                        <Download className="h-4 w-4" /> Download ZIP
                      </Button>
                    )}
                  </div>
                )}

                <div className="admin-dialog-footer">
                  <Button type="button" variant="outline" onClick={() => setShowBulkUpload(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!bulkFile || uploading || currentBatch?.status === 'processing'}
                  >
                    {uploading ? "Uploading..." : currentBatch?.status === 'processing' ? "Processing..." : "Upload & Generate"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-success/20 bg-success/5 p-4 text-sm text-success">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filters */}
      <div className="admin-toolbar mt-6 justify-between">
        <div className="admin-segmented">
          <button type="button" data-active={statusFilter === 'all'} onClick={() => handleStatusFilterChange('all')}>
            All ({counts.all})
          </button>
          <button type="button" data-active={statusFilter === 'active'} onClick={() => handleStatusFilterChange('active')}>
            Active ({counts.active})
          </button>
          <button type="button" data-active={statusFilter === 'revoked'} onClick={() => handleStatusFilterChange('revoked')}>
            Revoked ({counts.revoked})
          </button>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search certificates..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="admin-search-input pr-9"
          />
        </div>
      </div>

      {/* Certificates Table */}
      <div className="admin-card mt-6">
        {loading ? (
          <div className="admin-empty-state">
            <p className="text-sm text-muted-foreground">Loading certificates...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No certificates found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Certificate #</th>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Trainer</th>
                  <th>Issued</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert.id}>
                    <td className="font-mono text-xs text-foreground">{cert.certificate_number}</td>
                    <td className="font-medium text-foreground">{cert.student_name}</td>
                    <td className="text-muted-foreground">{cert.course_title}</td>
                    <td className="text-muted-foreground">{cert.trainer_name}</td>
                    <td className="text-muted-foreground">
                      {new Date(cert.issued_at).toLocaleDateString()}
                    </td>
                    <td>
                      <Badge variant={cert.status === 'active' ? 'success' : 'destructive'}>
                        {cert.status === 'active' ? (
                          <><CheckCircle className="mr-1 h-3 w-3" /> Active</>
                        ) : (
                          <><XCircle className="mr-1 h-3 w-3" /> Revoked</>
                        )}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          title="View certificate"
                          onClick={() => window.open(`/public-verification?cert=${cert.certificate_number}`, '_blank')}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>

                        {cert.status === 'active' ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="h-8 w-8 border-destructive/40 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive" title="Revoke certificate" disabled={revokingId === cert.id}>
                                <XCircle className="h-3.5 w-3.5" />
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
                              <div className="grid gap-2">
                                <Label htmlFor="revoke-reason">Reason for revocation</Label>
                                <Input
                                  id="revoke-reason"
                                  placeholder="e.g., Academic misconduct, error in issuance..."
                                />
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
                            className="h-8 w-8 p-0"
                            title="Restore certificate"
                            onClick={() => handleUnrevokeCertificate(cert.id)}
                            disabled={unrevokingId === cert.id}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
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
        {pagination && !loading && pagination.total > 0 && (
          <div className="admin-pagination-bar">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{pagination.from}</span> to{" "}
              <span className="font-medium text-foreground">{pagination.to}</span> of{" "}
              <span className="font-medium text-foreground">{pagination.total}</span> certificates
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Per page</Label>
                <Select
                  value={String(pageSize)}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="w-24 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex flex-wrap items-center gap-2">
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
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </AdminPageShell>
  );
}