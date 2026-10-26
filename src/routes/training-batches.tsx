import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardList,
  CircleAlert,
  Clock3,
  Eye,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  fetchTrainingBatch,
  fetchTrainingBatches,
  fetchTrainingBatchStats,
  type TrainingBatchDetail,
  type TrainingBatchListItem,
  type TrainingBatchStats,
} from "@/lib/training-batches";

const STATUS_LABELS: Record<TrainingBatchListItem["status"], string> = {
  DRAFT: "Draft",
  UPCOMING: "Upcoming",
  ACTIVE: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_STYLES: Record<TrainingBatchListItem["status"], string> = {
  DRAFT: "border-border bg-muted text-muted-foreground",
  UPCOMING: "border-amber-200 bg-amber-50 text-amber-800",
  ACTIVE: "border-primary/20 bg-primary/10 text-primary",
  COMPLETED: "border-border bg-muted text-muted-foreground",
  CANCELLED: "border-destructive/20 bg-destructive/5 text-destructive",
};

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function formatDateRange(batch: Pick<TrainingBatchListItem, "start_date" | "end_date">) {
  if (!batch.start_date && !batch.end_date) return "Not scheduled";
  if (!batch.start_date) return `Through ${formatDate(batch.end_date)}`;
  if (!batch.end_date || batch.start_date === batch.end_date) return formatDate(batch.start_date);
  return `${formatDate(batch.start_date)} – ${formatDate(batch.end_date)}`;
}

function safeMeetUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.hostname === "meet.google.com"
      && !url.port
      && !url.username
      && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function exportSchedule(batches: TrainingBatchListItem[]) {
  const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = [
    ["Batch Ref", "Training batch", "Course", "Dates", "Enrolled", "Capacity", "Location", "Status"],
    ...batches.map((batch) => [
      batch.batch_code,
      batch.name,
      batch.course_title,
      formatDateRange(batch),
      String(batch.enrolled_count),
      String(batch.capacity ?? ""),
      batch.location ?? "",
      STATUS_LABELS[batch.status],
    ]),
  ];
  const blob = new Blob([rows.map((row) => row.map(escapeCsv).join(",")).join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "training-batch-schedule.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function TrainingBatches() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [batches, setBatches] = useState<TrainingBatchListItem[]>([]);
  const [stats, setStats] = useState<TrainingBatchStats | null>(null);
  const [courseOptions, setCourseOptions] = useState<Array<{ id: number; title: string }>>([]);
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0, from: 0, to: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<TrainingBatchDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetchTrainingBatches(
          page,
          pagination.limit,
          search.trim(),
          statusFilter === "all" ? "" : statusFilter,
          courseFilter,
          locationFilter,
        );
        if (cancelled) return;
        setBatches(response.batches);
        setPagination(response.pagination);
        setCourseOptions(response.filter_options.courses);
        setLocationOptions(response.filter_options.locations);
      } catch (loadError) {
        if (cancelled) return;
        const message = loadError instanceof Error ? loadError.message : "Unable to load training batches.";
        setError(message);
        toast.error(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [page, pagination.limit, search, statusFilter, courseFilter, locationFilter]);

  useEffect(() => {
    let cancelled = false;
    fetchTrainingBatchStats()
      .then((response) => {
        if (!cancelled) setStats(response.stats);
      })
      .catch((loadError) => {
        if (!cancelled) {
          const message = loadError instanceof Error ? loadError.message : "Unable to load training batch summary.";
          toast.error(message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resetPage = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const openBatchDetails = async (batchId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setSelectedBatch(null);
    try {
      const response = await fetchTrainingBatch(batchId);
      setSelectedBatch(response.batch);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load training batch details.";
      toast.error(message);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <AdminPageShell withSidebar searchPlaceholder="Search certification, rig crew, batch...">
      <div className="page-padding space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <CalendarDays className="h-4 w-4" />
              Operations Logistics &amp; Scheduling
            </div>
            <h1 className="admin-page-title">Training Batches</h1>
            <p className="admin-page-subtitle max-w-2xl">
              Manage scheduled training batches, venue logistics, trainer assignments, and trainee capacity across yard and offshore simulations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exportSchedule(batches)} disabled={batches.length === 0}>
              <ArrowDownToLine className="h-4 w-4" />
              Export Current Page
            </Button>
            <Button onClick={() => navigate("/training/batches/create")}>
              <Plus className="h-4 w-4" />
              Create Batch
            </Button>
          </div>
        </div>

        <section aria-label="Batch overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Draft", value: stats?.draft_count, caption: "Batches still being prepared", icon: ClipboardList, color: "text-muted-foreground bg-muted" },
            { label: "Upcoming", value: stats?.upcoming_count, caption: "Scheduled training batches", icon: CalendarDays, color: "text-sky-700 bg-sky-50" },
            { label: "In Progress", value: stats?.active_count, caption: "Currently running", icon: Clock3, color: "text-primary bg-primary/10" },
            { label: "Completed", value: stats?.completed_count, caption: "Completed training batches", icon: Check, color: "text-muted-foreground bg-muted" },
            { label: "Cancelled", value: stats?.cancelled_count, caption: "Cancelled or rescheduled", icon: CircleAlert, color: "text-amber-800 bg-amber-50" },
          ].map(({ label, value, caption, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <span className={`grid h-8 w-8 place-items-center rounded-lg ${color}`}><Icon className="h-4 w-4" /></span>
              </div>
              <p className="mt-2 font-heading text-2xl font-bold">{value ?? "—"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
            </div>
          ))}
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5" aria-label="Batch filters">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold">Scheduled training batches</h2>
              <p className="text-sm text-muted-foreground">Filter scheduled batches by course, status, or training location.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {pagination.total} total batches
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search batches"
                className="pl-9"
                placeholder="Search batch code, name, course, location..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select value={courseFilter || "all"} onValueChange={(value) => resetPage(setCourseFilter, value === "all" ? "" : value)}>
              <SelectTrigger aria-label="Filter by course"><SelectValue placeholder="All Courses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courseOptions.map((course) => (
                  <SelectItem key={course.id} value={String(course.id)}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => resetPage(setStatusFilter, value)}>
              <SelectTrigger aria-label="Filter by status"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {(Object.keys(STATUS_LABELS) as TrainingBatchListItem["status"][]).map((status) => (
                  <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter || "all"} onValueChange={(value) => resetPage(setLocationFilter, value === "all" ? "" : value)}>
              <SelectTrigger aria-label="Filter by location"><SelectValue placeholder="All Locations" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locationOptions.map((location) => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[1050px]">
              <thead>
                <tr>
                  <th>Batch Ref / Course Module</th>
                  <th>Dates &amp; Schedule</th>
                  <th>Capacity &amp; Seats</th>
                  <th>Trainees</th>
                  <th>Trainer</th>
                  <th>Location / Bay</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const capacity = Number(batch.capacity ?? 0);
                  const fill = capacity ? Math.min(100, Math.round((batch.enrolled_count / capacity) * 100)) : 0;
                  return (
                    <tr key={batch.id}>
                      <td className="max-w-[270px]">
                        <button
                          type="button"
                          onClick={() => void openBatchDetails(batch.id)}
                          className="text-left font-mono text-xs font-semibold text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`View details for batch ${batch.batch_code}`}
                        >
                          {batch.batch_code}
                        </button>
                        <p className="mt-1 font-semibold text-foreground">{batch.course_title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{batch.name} · {batch.session_count} sessions</p>
                      </td>
                      <td className="whitespace-nowrap">
                        <p className="font-medium">{formatDateRange(batch)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{batch.session_count} scheduled sessions</p>
                      </td>
                      <td className="min-w-32">
                        <p className="font-semibold">{batch.enrolled_count} / {capacity || "—"}</p>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${fill}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{capacity ? `${fill}% ${fill === 100 ? "Full" : "Open"}` : "Capacity not set"}</p>
                      </td>
                      <td>
                        <span className="font-semibold">{batch.enrolled_count}</span>
                        <p className="mt-1 text-xs text-muted-foreground">enrolled</p>
                      </td>
                      <td className="min-w-36">
                        <p className="font-medium text-muted-foreground">Not assigned</p>
                        <p className="mt-1 text-xs text-muted-foreground">Trainer</p>
                      </td>
                      <td className="min-w-40">
                        <p className="flex items-center gap-1.5 font-medium"><MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />{batch.location || (batch.delivery_mode === "ONLINE" ? "Online" : "Not assigned")}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{batch.delivery_mode}</p>
                      </td>
                      <td><Badge variant="outline" className={STATUS_STYLES[batch.status]}>{STATUS_LABELS[batch.status]}</Badge></td>
                      <td className="text-right">
                        <Button
                          aria-label={`Preview ${batch.batch_code}`}
                          size="icon"
                          variant="ghost"
                          onClick={() => void openBatchDetails(batch.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {!loading && batches.length === 0 && (
                  <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">{error || "No training batches match these filters."}</td></tr>
                )}
                {loading && <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">Loading training batches…</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground">
            <span>Showing {pagination.from}–{pagination.to} of {pagination.total} training batches</span>
            <div className="flex items-center gap-2">
              <span className="mr-2 hidden sm:inline">Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span>
              <Button size="icon" variant="outline" disabled={loading || page <= 1} aria-label="Previous page" onClick={() => setPage((current) => current - 1)}><ArrowLeft className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" disabled={loading || page >= pagination.totalPages} aria-label="Next page" onClick={() => setPage((current) => current + 1)}><ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedBatch?.name ?? "Training batch details"}</DialogTitle>
              <DialogDescription>
                {selectedBatch
                  ? `${selectedBatch.batch_code} · ${selectedBatch.course_title}`
                  : "Review the schedule and seat allocations for this training batch."}
              </DialogDescription>
            </DialogHeader>
            {detailLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading batch details…</p>
            ) : selectedBatch ? (
              <div className="space-y-5">
                <div className="grid gap-3 rounded-lg bg-muted/50 p-4 text-sm sm:grid-cols-2">
                  <p><span className="font-semibold">Status:</span> {STATUS_LABELS[selectedBatch.status]}</p>
                  <p><span className="font-semibold">Dates:</span> {formatDateRange(selectedBatch)}</p>
                  <p><span className="font-semibold">Location:</span> {selectedBatch.location || (selectedBatch.delivery_mode === "ONLINE" ? "Online" : "Not assigned")}</p>
                  <p><span className="font-semibold">Capacity:</span> {selectedBatch.capacity ?? "Not set"}</p>
                  <p><span className="font-semibold">Minimum quorum:</span> {selectedBatch.min_quorum ?? "Not set"}</p>
                  <p><span className="font-semibold">Delivery:</span> {selectedBatch.delivery_mode}</p>
                </div>
                <section>
                  <h3 className="mb-2 text-sm font-semibold">Sessions ({selectedBatch.sessions.length})</h3>
                  {selectedBatch.sessions.length ? (
                    <ul className="space-y-2">
                      {selectedBatch.sessions.map((session) => {
                        const meetUrl = safeMeetUrl(session.online_url);
                        return (
                          <li key={session.id ?? `${session.session_date}-${session.title}`} className="rounded-lg border border-border p-3 text-sm">
                            <p className="font-medium">{session.title}</p>
                            <p className="mt-1 text-muted-foreground">
                              {formatDate(session.session_date)} · {session.start_time}–{session.end_time}
                              {session.location ? ` · ${session.location}` : selectedBatch.delivery_mode === "ONLINE" ? " · Online" : ""}
                            </p>
                            {meetUrl && (
                              <a
                                href={meetUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex text-sm font-medium text-primary underline underline-offset-4"
                              >
                                Join Google Meet
                              </a>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : <p className="text-sm text-muted-foreground">No sessions added.</p>}
                </section>
                <section>
                  <h3 className="mb-2 text-sm font-semibold">Seat allocations ({selectedBatch.allocations.length})</h3>
                  {selectedBatch.allocations.length ? (
                    <ul className="space-y-2">
                      {selectedBatch.allocations.map((allocation) => (
                        <li key={allocation.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                          <span>{allocation.organization_name || (allocation.allocation_type === "OPEN_ENROLLMENT" ? "Open enrollment" : allocation.engagement_name || "Contract allocation")}</span>
                          <span className="font-semibold">{allocation.seats_assigned} seats</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-muted-foreground">No seat allocations added.</p>}
                </section>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Batch workflow</p>
                <h2 className="mt-1 font-heading text-lg font-semibold">Draft to scheduled</h2>
              </div>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">Connected</Badge>
            </div>
            <div className="mt-5 flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-primary/20 text-sm font-bold text-primary">
                {stats?.total_batches ?? "—"}
              </div>
              <div>
                <p className="font-medium">Persisted training batches</p>
                <p className="mt-1 text-sm text-muted-foreground">Batch status, schedule, capacity, and seat allocations are saved to the training system.</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
              <span className="text-muted-foreground">Draft batches</span>
              <span className="font-semibold">{stats?.draft_count ?? "—"}</span>
            </div>
          </section>
          <section className="rounded-xl border border-amber-300/70 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-900">Scheduling note</p>
                <h2 className="mt-1 font-heading text-lg font-semibold text-amber-950">Trainer assignment is not configured</h2>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  Trainer assignment is intentionally left for a later workflow. Review session dates, venues, and allocations before marking a batch upcoming.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminPageShell>
  );
}
