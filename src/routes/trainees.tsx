import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Mail,
  MapPin,
  Phone,
  Power,
  PowerOff,
  Search,
  UserPlus,
  UserRoundCheck,
  UserRoundX,
  Users,
} from "lucide-react";
import { toast } from "sonner";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchAllUsers,
  toggleUserActivation,
  type UserPagination,
  type UserRecord,
  type TraineeStats,
} from "@/lib/users";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const EMPTY_STATS: TraineeStats = { total: 0, active: 0, inactive: 0, new_this_month: 0 };

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function getInitials(user: UserRecord) {
  return `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase();
}

function exportTrainees(users: UserRecord[]) {
  const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = [
    ["User ID", "Name", "Email", "Phone", "City", "Country", "Status", "Date Added"],
    ...users.map((user) => [
      String(user.id),
      user.name,
      user.email,
      user.phone ?? "",
      user.city ?? "",
      user.country ?? "",
      user.is_active ? "Active" : "Inactive",
      formatDate(user.created_at),
    ]),
  ];
  const blob = new Blob([rows.map((row) => row.map(escapeCsv).join(",")).join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "trainees.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function Trainees() {
  const navigate = useNavigate();
  const [trainees, setTrainees] = useState<UserRecord[]>([]);
  const [pagination, setPagination] = useState<UserPagination | null>(null);
  const [stats, setStats] = useState<TraineeStats>(EMPTY_STATS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTrainee, setSelectedTrainee] = useState<UserRecord | null>(null);
  const [changingStatusId, setChangingStatusId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timerId = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetchAllUsers(page, pageSize, search.trim(), "TRAINEE", statusFilter);
        if (cancelled) return;
        setTrainees(response.users);
        setPagination(response.pagination);
        setStats(response.trainee_stats ?? EMPTY_STATS);
        setPage(response.pagination.page);
      } catch (loadError) {
        if (cancelled) return;
        const message = loadError instanceof Error ? loadError.message : "Unable to load trainees.";
        setError(message);
        toast.error("Unable to load trainees", { description: message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [page, pageSize, refreshKey, search, statusFilter]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: "all" | "active" | "inactive") => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleToggleStatus = async (user: UserRecord) => {
    setChangingStatusId(user.id);
    try {
      await toggleUserActivation(user.id, !user.is_active);
      toast.success(`Trainee ${user.is_active ? "deactivated" : "activated"}`);
      setRefreshKey((key) => key + 1);
      setSelectedTrainee((current) => current?.id === user.id ? { ...current, is_active: !user.is_active } : current);
    } catch (statusError) {
      toast.error("Unable to update trainee status", {
        description: statusError instanceof Error ? statusError.message : "Please try again.",
      });
    } finally {
      setChangingStatusId(null);
    }
  };

  const statCards = [
    {
      label: "Total Trainees",
      value: stats.total,
      note: "Registered trainee accounts",
      icon: Users,
      iconStyle: "bg-primary/10 text-primary",
      progressStyle: "bg-primary",
      progress: stats.total ? Math.round((stats.active / stats.total) * 100) : 0,
    },
    {
      label: "Active Accounts",
      value: stats.active,
      note: "Currently able to access the portal",
      icon: UserRoundCheck,
      iconStyle: "bg-emerald-100 text-emerald-700",
      progressStyle: "bg-emerald-600",
      progress: stats.total ? Math.round((stats.active / stats.total) * 100) : 0,
    },
    {
      label: "Inactive Accounts",
      value: stats.inactive,
      note: "Access currently disabled",
      icon: UserRoundX,
      iconStyle: "bg-amber-100 text-amber-800",
      progressStyle: "bg-amber-500",
      progress: stats.total ? Math.round((stats.inactive / stats.total) * 100) : 0,
    },
    {
      label: "Added This Month",
      value: stats.new_this_month,
      note: "New trainee accounts this month",
      icon: Activity,
      iconStyle: "bg-sky-100 text-sky-700",
      progressStyle: "bg-sky-600",
      progress: stats.total ? Math.min(100, Math.round((stats.new_this_month / stats.total) * 100)) : 0,
    },
  ];

  return (
    <AdminPageShell withSidebar searchPlaceholder="Search trainees...">
      <div className="relative mx-auto w-full max-w-[1400px] space-y-6 overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-primary/5 to-transparent" />

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <Users className="h-4 w-4" />
              Training Operations
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Trainees</h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Central directory for trainee accounts and their contact details.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => navigate("/training/trainees/create")} className="rounded-xl shadow-sm">
              <UserPlus className="h-4 w-4" />
              Add Trainee
            </Button>
          </div>
        </div>

        <section aria-label="Trainee account summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ label, value, note, icon: Icon, iconStyle, progressStyle, progress }) => (
            <article key={label} className="group rounded-xl bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">{loading ? "—" : value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{note}</p>
                </div>
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-colors group-hover:bg-primary group-hover:text-primary-foreground ${iconStyle}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full transition-all ${progressStyle}`} style={{ width: `${progress}%` }} />
              </div>
            </article>
          ))}
        </section>

        <section aria-label="Filter trainees" className="space-y-4 rounded-xl bg-card p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 items-center gap-3 lg:grid-cols-12">
            <div className="relative lg:col-span-8">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search by trainee name, email, or phone..."
                aria-label="Search trainees by name, email, or phone"
                className="h-11 rounded-xl border-0 bg-muted pl-10 focus-visible:bg-background"
              />
            </div>
            <div className="lg:col-span-4">
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger aria-label="Filter by account status" className="h-11 rounded-xl border-0 bg-muted">
                  <SelectValue placeholder="Account status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All account statuses</SelectItem>
                  <SelectItem value="active">Active accounts</SelectItem>
                  <SelectItem value="inactive">Inactive accounts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
            <p className="text-xs text-muted-foreground">
              Showing account status: <span className="font-semibold text-foreground">
                {statusFilter === "all" ? "All" : statusFilter === "active" ? "Active" : "Inactive"}
              </span>
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => exportTrainees(trainees)}
              disabled={trainees.length === 0 || loading}
              className="text-primary"
            >
              <Download className="h-4 w-4" />
              Export current page
            </Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl bg-card shadow-sm" aria-label="Trainee directory">
          {error ? (
            <div className="px-6 py-12 text-center">
              <p className="font-semibold text-destructive">Trainees could not be loaded</p>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <Button className="mt-4" variant="outline" onClick={() => setRefreshKey((key) => key + 1)}>Try again</Button>
            </div>
          ) : loading ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading trainees…</div>
          ) : trainees.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-semibold text-foreground">No trainees found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try a different search or account status.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead className="bg-muted/70 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">Trainee</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Phone</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Location</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Account Status</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Date Added</th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-sm">
                  {trainees.map((trainee) => (
                    <tr key={trainee.id} className="group transition-colors hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <div className="flex min-w-48 items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {getInitials(trainee)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground group-hover:text-primary">{trainee.name}</p>
                            <p className="text-[11px] tracking-wide text-muted-foreground">User ID #{trainee.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-56 truncate px-4 py-3 text-xs text-foreground">{trainee.email}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{trainee.phone || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {[trainee.city, trainee.country].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                          trainee.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {trainee.is_active ? <BadgeCheck className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                          {trainee.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{formatDate(trainee.created_at)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`View ${trainee.name} profile`}
                            title="View profile"
                            onClick={() => setSelectedTrainee(trainee)}
                            className="h-9 w-9 text-primary"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`${trainee.is_active ? "Deactivate" : "Activate"} ${trainee.name}`}
                            title={trainee.is_active ? "Deactivate account" : "Activate account"}
                            disabled={changingStatusId === trainee.id}
                            onClick={() => void handleToggleStatus(trainee)}
                            className="h-9 w-9 text-muted-foreground"
                          >
                            {trainee.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && pagination && pagination.total > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-border/60 bg-muted/40 px-4 py-4 sm:flex-row sm:px-5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span>
                  Showing <strong className="text-foreground">{pagination.from}–{pagination.to}</strong> of{" "}
                  <strong className="text-foreground">{pagination.total}</strong> trainees
                </span>
                <div className="flex items-center gap-2">
                  <Label htmlFor="trainee-page-size" className="text-xs text-muted-foreground">Per page</Label>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger id="trainee-page-size" className="h-8 w-20 bg-background text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Previous page"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="h-9 w-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-20 text-center text-xs text-muted-foreground">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Next page"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                    className="h-9 w-9"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <Dialog open={selectedTrainee !== null} onOpenChange={(open) => { if (!open) setSelectedTrainee(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Trainee Profile</DialogTitle>
            <DialogDescription>Account details currently on file.</DialogDescription>
          </DialogHeader>
          {selectedTrainee && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {getInitials(selectedTrainee)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">{selectedTrainee.name}</p>
                  <p className="text-sm text-muted-foreground">User ID #{selectedTrainee.id}</p>
                </div>
                <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-medium ${
                  selectedTrainee.is_active ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {selectedTrainee.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="grid gap-3 rounded-xl bg-muted/50 p-4 text-sm">
                <p className="flex items-center gap-3 break-all"><Mail className="h-4 w-4 shrink-0 text-primary" />{selectedTrainee.email}</p>
                <p className="flex items-center gap-3"><Phone className="h-4 w-4 shrink-0 text-primary" />{selectedTrainee.phone || "No phone number on file"}</p>
                <p className="flex items-center gap-3"><MapPin className="h-4 w-4 shrink-0 text-primary" />{[selectedTrainee.city, selectedTrainee.country].filter(Boolean).join(", ") || "No location on file"}</p>
                <p className="flex items-center gap-3"><CalendarDays className="h-4 w-4 shrink-0 text-primary" />Added {formatDate(selectedTrainee.created_at)}</p>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant={selectedTrainee.is_active ? "outline" : "default"}
                  onClick={() => void handleToggleStatus(selectedTrainee)}
                  disabled={changingStatusId === selectedTrainee.id}
                >
                  {selectedTrainee.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                  {selectedTrainee.is_active ? "Deactivate account" : "Activate account"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
