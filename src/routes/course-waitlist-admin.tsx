import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  CalendarDays,
  Clock3,
  MailCheck,
  Search,
  Users,
} from "lucide-react";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  fetchAdminWaitlist,
  type AdminWaitlistEntry,
  type AdminWaitlistPagination,
} from "@/lib/course-waitlist-admin";

const STATUS_LABELS: Record<string, string> = {
  WAITLISTED: "Waitlisted",
  CANCELLED: "Cancelled",
};

const STATUS_STYLES: Record<string, string> = {
  WAITLISTED: "border-amber-200 bg-amber-50 text-amber-800",
  CANCELLED: "border-border bg-muted text-muted-foreground",
};

const TIMEFRAME_LABELS: Record<string, string> = {
  asap: "ASAP",
  "30days": "Within 30 days",
  "90days": "Within 90 days",
  "6months": "Within 6 months",
  unsure: "No preference",
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTargetTimeframe(value: string | null) {
  if (!value) return "—";
  if (TIMEFRAME_LABELS[value]) return TIMEFRAME_LABELS[value];
  // A YYYY-MM-DD value is a specific target date picked on the waitlist form.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric" })
      .format(new Date(`${value}T00:00:00`));
  }
  return value;
}

export default function CourseWaitlistAdmin() {
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entries, setEntries] = useState<AdminWaitlistEntry[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [courseOptions, setCourseOptions] = useState<Array<{ id: number; title: string }>>([]);
  const [pagination, setPagination] = useState<AdminWaitlistPagination>({ page: 1, limit: 15, total: 0, totalPages: 0, from: 0, to: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetchAdminWaitlist(
          page,
          pagination.limit,
          search.trim(),
          courseFilter,
          statusFilter === "all" ? "" : statusFilter,
        );
        if (cancelled) return;
        setEntries(response.entries);
        setPagination(response.pagination);
        setCourseOptions(response.filter_options.courses);
        setStatusCounts(
          Object.fromEntries(response.filter_options.status_counts.map((row) => [row.status, row.count])),
        );
      } catch (loadError) {
        if (cancelled) return;
        const message = loadError instanceof Error ? loadError.message : "Unable to load the course waitlist.";
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
  }, [page, pagination.limit, search, statusFilter, courseFilter]);

  const resetPage = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const waitlistedCount = statusCounts.WAITLISTED ?? 0;
  const totalCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  return (
    <AdminPageShell withSidebar searchPlaceholder="Search waitlist entries...">
      <div className="page-padding space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <BellRing className="h-4 w-4" />
              Enrollment Pipeline
            </div>
            <h1 className="admin-page-title">Course Waitlist</h1>
            <p className="admin-page-subtitle max-w-2xl">
              Everyone waiting for a course intake — across all courses. Entries leave the waitlist automatically once the person enrolls.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/training/batches">
              <ArrowLeft className="h-4 w-4" />
              Back to Batches
            </Link>
          </Button>
        </div>

        <section aria-label="Waitlist overview" className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Waiting", value: statusCounts.WAITLISTED, caption: "Awaiting an open intake", icon: Users, color: "text-amber-700 bg-amber-50" },
            { label: "Cancelled", value: statusCounts.CANCELLED, caption: "Removed from the waitlist", icon: Clock3, color: "text-muted-foreground bg-muted" },
            { label: "Total entries", value: totalCount, caption: "Current waitlist records", icon: BellRing, color: "text-primary bg-primary/10" },
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

        <section className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5" aria-label="Waitlist filters">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold">Waitlist entries</h2>
              <p className="text-sm text-muted-foreground">Filter by course, status, or search by name, email, ticket, or course.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {pagination.total} total {pagination.total === 1 ? "entry" : "entries"}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search waitlist"
                className="pl-9"
                placeholder="Search name, email, ticket, course..."
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
                <SelectItem value="all">All Statuses ({Object.values(statusCounts).reduce((a, b) => a + b, 0)})</SelectItem>
                {(Object.keys(STATUS_LABELS) as string[]).map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}{statusCounts[status] ? ` (${statusCounts[status]})` : ""}
                  </SelectItem>
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
                  <th>Ticket</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Course</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th>Notified</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="font-mono text-xs font-semibold text-primary">{entry.ticket_number}</td>
                    <td>
                      <p className="font-semibold">{entry.full_name}</p>
                      {entry.organization && <p className="mt-0.5 text-xs text-muted-foreground">{entry.organization}</p>}
                    </td>
                    <td className="min-w-44">
                      <p className="font-medium">{entry.email}</p>
                      {entry.phone && <p className="mt-0.5 text-xs text-muted-foreground">{entry.phone}</p>}
                    </td>
                    <td className="max-w-[220px]">
                      <p className="font-medium">{entry.course_title}</p>
                      {entry.course_code && <p className="mt-0.5 text-xs text-muted-foreground">{entry.course_code}</p>}
                    </td>
                    <td className="whitespace-nowrap">{formatTargetTimeframe(entry.timeframe)}</td>
                    <td>
                      <Badge variant="outline" className={STATUS_STYLES[entry.status] ?? STATUS_STYLES.CANCELLED}>
                        {STATUS_LABELS[entry.status] ?? entry.status}
                      </Badge>
                    </td>
                    <td>
                      {entry.notified_at ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <MailCheck className="h-3.5 w-3.5" />
                          {formatDateTime(entry.notified_at)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(entry.created_at)}</td>
                  </tr>
                ))}
                {!loading && entries.length === 0 && (
                  <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">{error || "No waitlist entries match these filters."}</td></tr>
                )}
                {loading && <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">Loading waitlist…</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground">
            <span>Showing {pagination.from}–{pagination.to} of {pagination.total} waitlist {pagination.total === 1 ? "entry" : "entries"}</span>
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

        {waitlistedCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {waitlistedCount} {waitlistedCount === 1 ? "person is" : "people are"} currently waitlisted. Creating or publishing a batch for their course emails them an enrollment link automatically.
          </p>
        )}
      </div>
    </AdminPageShell>
  );
}
