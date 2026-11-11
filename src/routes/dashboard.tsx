import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Eye,
  GraduationCap,
  MapPin,
  MoreHorizontal,
  Search,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { useAuth } from "@/context/AuthContext";
import { downloadCourseReceipt, initializeCoursePayment } from "@/lib/courses";
import { fetchTraineeDashboard, type TraineeDashboardCourse } from "@/lib/trainee-dashboard";
import courseRigImage from "@/assets/course-rig.jpg";
import courseSubseaImage from "@/assets/course-subsea.jpg";
import courseHazmatImage from "@/assets/course-hazmat.jpg";

type TrainingFilter = "all" | "active" | "upcoming" | "completed" | "cancelled";
type FundingFilter = "all" | "sponsored" | "self";

const filters: { id: TrainingFilter; label: string }[] = [
  { id: "all", label: "All trainings" },
  { id: "active", label: "Active" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const metrics: { label: string; icon: LucideIcon; tone: string }[] = [
  { label: "Active & in progress", icon: GraduationCap, tone: "text-primary" },
  { label: "Upcoming batches", icon: CalendarDays, tone: "text-amber-700" },
  { label: "Completed trainings", icon: CheckCircle2, tone: "text-blue-700" },
  { label: "Sponsor covered", icon: Building2, tone: "text-emerald-700" },
];

function displayName(user: { first_name?: string; last_name?: string; name?: string; email?: string } | null | undefined) {
  if (!user) return "Trainee";
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  if (user.name) return user.name;
  return user.email?.split("@")[0] || "Trainee";
}

function getCourseImage(course: TraineeDashboardCourse) {
  const category = course.category?.toLowerCase() || "";
  if (category.includes("safety") || category.includes("hse")) return courseHazmatImage;
  if (category.includes("technical") || category.includes("engineering")) return courseRigImage;
  return courseSubseaImage;
}

function isSponsored(course: TraineeDashboardCourse) {
  return Boolean(course.sponsor_name) || ["ORGANIZATION", "SPONSORED"].includes(course.source_type?.toUpperCase() || "");
}

function matchesStatus(course: TraineeDashboardCourse, filter: TrainingFilter) {
  if (filter === "all") return true;
  if (filter === "active") return course.training_status === "ACTIVE";
  if (filter === "upcoming") return course.training_status === "UPCOMING" || course.training_status === "PENDING_PAYMENT";
  if (filter === "completed") return course.training_status === "COMPLETED";
  return course.training_status === "CANCELLED";
}

function statusLabel(course: TraineeDashboardCourse) {
  switch (course.training_status) {
    case "ACTIVE": return "Active";
    case "UPCOMING": return "Upcoming";
    case "PENDING_PAYMENT": return "Pending payment";
    case "COMPLETED": return "Completed";
    case "CANCELLED": return "Cancelled";
  }
}

function statusStyles(course: TraineeDashboardCourse) {
  switch (course.training_status) {
    case "ACTIVE": return "bg-emerald-100 text-emerald-900";
    case "UPCOMING": return "bg-amber-100 text-amber-900";
    case "PENDING_PAYMENT": return "bg-amber-100 text-amber-900";
    case "COMPLETED": return "bg-primary/10 text-primary";
    case "CANCELLED": return "bg-muted text-muted-foreground";
  }
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function formatDateRange(start: string | null, end: string | null) {
  const formattedStart = formatDate(start);
  const formattedEnd = formatDate(end);
  if (formattedStart && formattedEnd) return `${formattedStart} – ${formattedEnd}`;
  return formattedStart || formattedEnd || "Schedule to be confirmed";
}

function formatMoney(value: string | number | null, currency: string | null) {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  const normalizedCurrency = ["NGN", "USD", "EUR", "GBP"].includes(currency?.toUpperCase() || "")
    ? currency!.toUpperCase()
    : "NGN";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: normalizedCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatKobo(value: number | string | null, currency: string | null) {
  if (value === null || !Number.isFinite(Number(value))) return null;
  return formatMoney(Number(value) / 100, currency || "NGN");
}

function getFundingLabel(course: TraineeDashboardCourse) {
  if (course.sponsor_name) return `${course.sponsor_name} sponsored`;
  if (isSponsored(course)) return "Organization sponsored";
  return "Self-funded";
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function exportLedger(courses: TraineeDashboardCourse[]) {
  const header = ["Course", "Course code", "Batch", "Status", "Funding", "Start date", "End date", "Location", "Progress"];
  const rows = courses.map((course) => [
    course.title,
    course.code,
    course.batch_code,
    statusLabel(course),
    getFundingLabel(course),
    formatDate(course.start_date),
    formatDate(course.end_date),
    course.location,
    `${course.completion_percentage}%`,
  ]);
  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "my-training-ledger.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const { user } = useAuth() as {
    user: { first_name?: string; last_name?: string; name?: string; email?: string; id?: number } | null;
  };
  const [courses, setCourses] = useState<TraineeDashboardCourse[]>([]);
  const [activeCertificates, setActiveCertificates] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<TrainingFilter>("all");
  const [fundingFilter, setFundingFilter] = useState<FundingFilter>("all");
  const [search, setSearch] = useState("");
  const [continuingPayment, setContinuingPayment] = useState<number | null>(null);
  const name = displayName(user);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetchTraineeDashboard()
      .then((summary) => {
        if (!active) return;
        setCourses(summary.courses);
        setActiveCertificates(summary.active_certificates);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Could not load your training records.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  const counts = useMemo(() => ({
    all: courses.length,
    active: courses.filter((course) => course.training_status === "ACTIVE").length,
    upcoming: courses.filter((course) => ["UPCOMING", "PENDING_PAYMENT"].includes(course.training_status)).length,
    completed: courses.filter((course) => course.training_status === "COMPLETED").length,
    cancelled: courses.filter((course) => course.training_status === "CANCELLED").length,
    sponsored: courses.filter(isSponsored).length,
    self: courses.filter((course) => !isSponsored(course)).length,
  }), [courses]);

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesQuery = !query || [
        course.title,
        course.code,
        course.batch_code,
        course.batch_name,
        course.category,
        course.sponsor_name,
        course.location,
      ].some((value) => value?.toLowerCase().includes(query));
      const matchesFunding = fundingFilter === "all" || (fundingFilter === "sponsored" ? isSponsored(course) : !isSponsored(course));
      return matchesQuery && matchesFunding && matchesStatus(course, statusFilter);
    });
  }, [courses, fundingFilter, search, statusFilter]);

  const activeCourses = courses.filter((course) => course.training_status === "ACTIVE");
  const upcomingCourses = courses.filter((course) => ["UPCOMING", "PENDING_PAYMENT"].includes(course.training_status));
  const completedCourses = courses.filter((course) => course.training_status === "COMPLETED");
  const metricDetails = [
    activeCourses.slice(0, 2).map((course) => course.title).join(" · ") || "No active training",
    upcomingCourses.slice(0, 2).map((course) => {
      const date = formatDate(course.start_date);
      return date ? `${course.title} · ${date}` : course.title;
    }).join(" · ") || "No upcoming batches",
    completedCourses.slice(0, 2).map((course) => course.title).join(" · ") || "No completed training yet",
    counts.sponsored ? `${counts.sponsored} sponsored registration${counts.sponsored === 1 ? "" : "s"}` : "No sponsored registrations",
  ];
  const metricValues = [counts.active, counts.upcoming, counts.completed, counts.sponsored];

  const continuePayment = async (course: TraineeDashboardCourse) => {
    if (!course.pending_payment_method) {
      toast.error("Payment method is unavailable for this checkout.", {
        description: "Open the course catalog or contact the training team for help.",
      });
      return;
    }

    setContinuingPayment(course.course_id);
    try {
      const checkout = await initializeCoursePayment(course.course_id);
      const url = new URL(checkout.authorization_url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.paystack.com") {
        throw new Error("Paystack returned an invalid checkout address.");
      }
      window.location.assign(url.toString());
    } catch (cause) {
      toast.error("Could not resume payment", {
        description: cause instanceof Error ? cause.message : "Please try again or contact the training team.",
      });
      setContinuingPayment(null);
    }
  };

  return (
    <AdminPageShell withSidebar searchPlaceholder="Search your trainings...">
      <main className="page-padding min-h-screen">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Link to="/training/trainee-dashboard" className="transition-colors hover:text-primary">Trainee portal</Link>
                <span aria-hidden="true">/</span>
                <span className="font-semibold text-foreground">My trainings</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">My Trainings</h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Welcome back, {name}. View your training registrations, schedules, payment status, and credentials.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!courses.length}
                onClick={() => exportLedger(courses)}
                className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" /> Export ledger
              </button>
              <Link to="/training/courses" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
                <GraduationCap className="h-4 w-4" /> Browse training
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <section aria-label="Training summary" className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, index) => (
              <article key={metric.label} className="relative flex min-h-36 flex-col justify-between overflow-hidden rounded-xl border border-border/60 bg-card p-5 shadow-sm">
                <div className="pointer-events-none absolute -bottom-5 -right-5 h-24 w-24 rounded-full bg-primary/[0.04]" />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{metric.label}</span>
                    <span className={`mt-2 text-3xl font-extrabold leading-none ${metric.tone}`}>
                      {loading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-muted" /> : String(metricValues[index])}
                    </span>
                  </div>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted ${metric.tone}`}>
                    <metric.icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="relative mt-4 line-clamp-1 text-xs font-medium text-muted-foreground">
                  {loading ? "Loading your records…" : metricDetails[index]}
                </p>
              </article>
            ))}
          </section>

          <section className="mb-5 flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between sm:p-5">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 xl:pb-0" aria-label="Filter trainings by status">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={statusFilter === filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                    statusFilter === filter.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {filter.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${statusFilter === filter.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {counts[filter.id]}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <span className="sr-only">Search trainings</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Filter course or code..."
                  className="h-10 w-full rounded-lg border border-border bg-muted/50 pl-9 pr-3 text-sm outline-none transition focus:bg-background focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="sr-only" htmlFor="training-funding-filter">Filter by funding type</label>
              <select
                id="training-funding-filter"
                value={fundingFilter}
                onChange={(event) => setFundingFilter(event.target.value as FundingFilter)}
                className="h-10 rounded-lg border border-border bg-muted/50 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Funding: All types</option>
                <option value="sponsored">Sponsored ({counts.sponsored})</option>
                <option value="self">Self-funded ({counts.self})</option>
              </select>
            </div>
          </section>

          <section aria-label="My training registrations" className="mb-10 flex flex-col gap-4">
            {loading ? (
              [0, 1, 2].map((item) => <div key={item} className="h-44 animate-pulse rounded-xl bg-muted" />)
            ) : filteredCourses.length ? (
              filteredCourses.map((course) => (
                <TrainingCard
                  key={`${course.course_id}-${course.enrollment_id ?? course.payment_reference ?? "legacy"}`}
                  course={course}
                  continuingPayment={continuingPayment === course.course_id}
                  onContinuePayment={() => void continuePayment(course)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
                  <Search className="h-6 w-6" />
                </span>
                <h2 className="mt-4 text-lg font-bold">{courses.length ? "No trainings match these filters" : "No training registrations yet"}</h2>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  {courses.length ? "Try another search or funding filter." : "Your course registrations will appear here once you enroll."}
                </p>
                {!courses.length && (
                  <Link to="/training/courses" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                    Browse training <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            )}
          </section>

          <section className="mb-8 flex flex-col gap-5 rounded-xl border border-border/60 bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between sm:p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <UsersRound className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Training support</p>
                <h2 className="mt-1 text-lg font-bold">Need help with a registration or sponsorship?</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Contact the training team for help with your batch schedule, payment status, or registration details.
                </p>
              </div>
            </div>
            <Link to="/contact" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
              <ShieldCheck className="h-4 w-4" /> Contact support
            </Link>
          </section>
          <p className="mb-3 text-center text-xs text-muted-foreground">
            {activeCertificates} active certificate{activeCertificates === 1 ? "" : "s"} on your training record
          </p>
        </div>
      </main>
    </AdminPageShell>
  );
}

function TrainingCard({
  course,
  continuingPayment,
  onContinuePayment,
}: {
  course: TraineeDashboardCourse;
  continuingPayment: boolean;
  onContinuePayment: () => void;
}) {
  const status = course.training_status;
  const sponsored = isSponsored(course);
  const pendingPayment = status === "PENDING_PAYMENT";
  const completed = status === "COMPLETED";
  const certificate = course.latest_certificate_number;
  const feeOutstanding = pendingPayment
    ? formatKobo(course.pending_amount_kobo, course.currency)
    : null;
  const paidAmount = formatMoney(course.paid_amount, course.paid_currency);
  const courseFee = formatMoney(course.course_price, course.currency);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const downloadReceipt = async () => {
    const reference = course.paid_payment_reference;
    if (!reference) return;
    setReceiptLoading(true);
    try {
      await downloadCourseReceipt(reference);
    } catch (cause) {
      toast.error("Could not download the receipt", {
        description: cause instanceof Error ? cause.message : "Please try again later.",
      });
    } finally {
      setReceiptLoading(false);
    }
  };

  return (
    <article className="relative flex flex-col gap-5 overflow-hidden rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md lg:flex-row lg:items-center lg:justify-between sm:p-6">
      <div className={`absolute inset-y-0 left-0 w-1.5 ${pendingPayment ? "bg-amber-400" : completed ? "bg-primary" : status === "CANCELLED" ? "bg-muted-foreground" : "bg-emerald-600"}`} />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-20 sm:w-20">
          <img src={getCourseImage(course)} alt="" className="h-full w-full object-cover" loading="lazy" />
          <div className={`absolute inset-0 flex items-center justify-center ${pendingPayment ? "bg-amber-500/15" : "bg-primary/10"}`}>
            {pendingPayment ? <CreditCard className="h-7 w-7 text-amber-800" /> : completed ? <Award className="h-7 w-7 text-primary" /> : <GraduationCap className="h-7 w-7 text-primary" />}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles(course)}`}>
              {pendingPayment ? <Clock3 className="h-3.5 w-3.5" /> : completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className={`h-1.5 w-1.5 rounded-full ${status === "ACTIVE" ? "animate-pulse bg-emerald-700" : "bg-current"}`} />}
              {statusLabel(course)}
            </span>
            {course.batch_code && <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{course.batch_code}</span>}
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${sponsored ? "bg-emerald-50 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
              {sponsored ? <Building2 className="h-3.5 w-3.5" /> : <CreditCard className="h-3.5 w-3.5" />}
              {getFundingLabel(course)}
            </span>
          </div>

          <h2 className="text-lg font-bold leading-snug text-foreground sm:text-xl">{course.title}</h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:text-sm">
            {course.code && <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4" />{course.code}</span>}
            {course.batch_name && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{course.batch_name}</span>}
            {(course.start_date || course.end_date) && <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{formatDateRange(course.start_date, course.end_date)}</span>}
            {course.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{course.location}</span>}
          </div>

          {pendingPayment ? (
            <p className="inline-flex flex-wrap items-center gap-1.5 text-xs font-medium text-amber-800 sm:text-sm">
              <CreditCard className="h-4 w-4 shrink-0" />
              {feeOutstanding ? <>Payment outstanding: <strong className="text-foreground">{feeOutstanding}</strong></> : "Payment is required to confirm this registration."}
              <span>— your seat is not reserved until checkout is complete.</span>
            </p>
          ) : paidAmount ? (
            <p className="inline-flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              {paidAmount} payment recorded{course.paid_payment_method ? ` via ${course.paid_payment_method.replace(/_/g, " ").toLowerCase()}` : ""}
              {/* {course.paid_payment_reference && <span className="font-mono">· Ref {course.paid_payment_reference}</span>} */}
            </p>
          ) : courseFee && Number(course.course_price) > 0 && !sponsored ? (
            <p className="text-xs text-muted-foreground sm:text-sm">Course fee: <strong className="text-foreground">{courseFee}</strong></p>
          ) : null}

          {status === "ACTIVE" && course.total_modules > 0 && (
            <div className="flex max-w-md items-center gap-3 pt-1">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${course.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={course.completion_percentage}>
                <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${course.completion_percentage}%` }} />
              </div>
              <span className="shrink-0 text-xs font-bold text-primary">{course.completion_percentage}% Complete</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-start justify-between gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center lg:flex-col lg:items-end lg:border-0 lg:pt-0">
        {(completed || pendingPayment) && (
          <div className="lg:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {completed ? "Certificate" : "Registration"}
            </span>
            <p className={`mt-1 inline-flex items-center gap-1.5 text-xs font-semibold ${certificate ? "text-primary" : "text-muted-foreground"}`}>
              {certificate ? <ShieldCheck className="h-4 w-4" /> : pendingPayment ? <Clock3 className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
              {certificate ? `Certified · ${certificate}` : pendingPayment ? "Checkout required" : "No active certificate recorded"}
            </p>
          </div>
        )}
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto lg:justify-end">
          {pendingPayment ? (
            <button
              type="button"
              onClick={onContinuePayment}
              disabled={continuingPayment}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-amber-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-800 disabled:cursor-wait disabled:opacity-60 sm:flex-none"
            >
              <CreditCard className="h-4 w-4" /> {continuingPayment ? "Connecting…" : "Complete payment"}
            </button>
          ) : certificate ? (
            <Link to="/training/verify" className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-xs font-bold text-primary transition hover:bg-primary/15 sm:flex-none">
              <Award className="h-4 w-4" /> View certificate
            </Link>
          ) : null}
          <Link
            to={`/training/trainee-dashboard/${course.course_id}`}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-xs font-bold text-foreground transition hover:bg-muted sm:flex-none"
          >
            <Eye className="h-4 w-4" /> View details
          </Link>
          {course.paid_payment_reference && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="More actions"
                  className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-border bg-background px-3 text-foreground transition hover:bg-muted"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={receiptLoading}
                  onSelect={() => void downloadReceipt()}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {receiptLoading ? "Preparing receipt…" : "Download receipt"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </article>
  );
}
