import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  Anchor,
  ArrowLeft,
  Award,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  CreditCard,
  Download,
  FileText,
  GraduationCap,
  Headset,
  IdCard,
  Info,
  Landmark,
  Lock,
  MapPin,
  Nfc,
  Phone,
  Play,
  ShieldCheck,
  Timer,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { useAuth } from "@/context/AuthContext";
import { downloadCourseReceipt, initializeCoursePayment } from "@/lib/courses";
import {
  fetchTraineeTrainingDetail,
  type TraineeTrainingAssessment,
  type TraineeTrainingCertificate,
  type TraineeTrainingDetail,
  type TraineeTrainingModule,
  type TraineeTrainingSession,
} from "@/lib/trainee-dashboard";
import courseRigImage from "@/assets/course-rig.jpg";
import courseSubseaImage from "@/assets/course-subsea.jpg";
import courseHazmatImage from "@/assets/course-hazmat.jpg";

function displayName(user: { first_name?: string; last_name?: string; name?: string; email?: string } | null | undefined) {
  if (!user) return "Trainee";
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  if (user.name) return user.name;
  return user.email?.split("@")[0] || "Trainee";
}

function getCourseImage(course: { category?: string | null; thumbnail_url?: string | null }) {
  if (course.thumbnail_url) return course.thumbnail_url;
  const category = course.category?.toLowerCase() || "";
  if (category.includes("safety") || category.includes("hse")) return courseHazmatImage;
  if (category.includes("technical") || category.includes("engineering")) return courseRigImage;
  return courseSubseaImage;
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function formatDateRange(start: string | null | undefined, end: string | null | undefined) {
  const formattedStart = formatDate(start);
  const formattedEnd = formatDate(end);
  if (formattedStart && formattedEnd) return `${formattedStart} – ${formattedEnd}`;
  return formattedStart || formattedEnd || "Schedule to be confirmed";
}

function formatRegWindow(start: string | null | undefined, end: string | null | undefined) {
  const formattedStart = formatDate(start);
  const formattedEnd = formatDate(end);
  if (formattedStart && formattedEnd) {
    return formattedStart === formattedEnd ? `Closes ${formattedEnd}` : `${formattedStart} – ${formattedEnd}`;
  }
  if (formattedStart) return `From ${formattedStart}`;
  if (formattedEnd) return `Until ${formattedEnd}`;
  return "Open enrollment";
}

function formatTime(value: string | null | undefined) {
  if (!value) return null;
  const [hours, minutes] = value.split(":");
  const hour = Number(hours);
  if (!Number.isFinite(hour)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minutes || "00"} ${suffix}`;
}

function formatMoney(value: string | number | null | undefined, currency: string | null | undefined) {
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

function formatKobo(value: number | null | undefined, currency: string | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return null;
  return formatMoney(Number(value) / 100, currency || "NGN");
}

function formatDuration(course: { duration_value?: number | null; duration_unit?: string | null }) {
  if (!course.duration_value) return null;
  return `${course.duration_value} ${(course.duration_unit || "hours").toLowerCase()}`;
}

function statusLabel(status: string | null | undefined) {
  switch (status) {
    case "IN_PROGRESS": return "In progress";
    case "ENROLLED": return "Enrolled";
    case "PENDING_PAYMENT": return "Pending payment";
    case "COMPLETED": return "Completed";
    case "CANCELLED": return "Cancelled";
    default: return "Registered";
  }
}

function statusStyles(status: string | null | undefined) {
  switch (status) {
    case "IN_PROGRESS": return "bg-emerald-100 text-emerald-900";
    case "ENROLLED": return "bg-sky-100 text-sky-900";
    case "PENDING_PAYMENT": return "bg-amber-100 text-amber-900";
    case "COMPLETED": return "bg-primary/10 text-primary";
    case "CANCELLED": return "bg-muted text-muted-foreground";
    default: return "bg-muted text-muted-foreground";
  }
}

function moduleProgress(module: TraineeTrainingModule) {
  const status = module.progress_status;
  const pct = Number(module.progress_percentage || 0);
  if (status === "COMPLETED") return { label: "Completed", detail: module.progress_completed_at ? formatDate(module.progress_completed_at) : null, pct: 100, state: "done" as const };
  if (status === "IN_PROGRESS") return { label: "In progress", detail: `${Math.round(pct)}%`, pct, state: "active" as const };
  if (module.scheduled_date && new Date(module.scheduled_date).getTime() < Date.now()) {
    return { label: "Scheduled", detail: formatDate(module.scheduled_date), pct: 0, state: "missed" as const };
  }
  return { label: module.scheduled_date ? `Scheduled ${formatDate(module.scheduled_date)}` : "Not started", detail: null, pct: 0, state: "pending" as const };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function Fact({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function CardHeader({
  icon: Icon,
  iconClass,
  title,
  subtitle,
  badge,
}: {
  icon: LucideIcon;
  iconClass: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {badge}
    </div>
  );
}

export default function TraineeTrainingDetails() {
  const { courseId } = useParams();
  const { user } = useAuth() as {
    user: { id?: number; first_name?: string; last_name?: string; name?: string; email?: string } | null;
  };
  const [detail, setDetail] = useState<TraineeTrainingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [continuingPayment, setContinuingPayment] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const name = displayName(user);
  const numericCourseId = Number(courseId);

  useEffect(() => {
    let active = true;
    if (!Number.isInteger(numericCourseId) || numericCourseId <= 0) {
      setError("This training link is invalid.");
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError("");
    fetchTraineeTrainingDetail(numericCourseId)
      .then((result) => {
        if (active) setDetail(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load this training.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [numericCourseId, user?.id]);

  const enrollment = detail?.enrollment;
  const course = detail?.course;
  const batch = enrollment?.batch || null;
  const modules = detail?.modules || [];
  const sessions = detail?.sessions || [];
  const assessments = detail?.assessments || [];
  const certificates = detail?.certificates || [];
  const activeCertificate = certificates.find((certificate) => certificate.status === "active") || certificates[0] || null;

  const completedModules = modules.filter((module) => module.progress_status === "COMPLETED").length;
  const attendedSessions = sessions.filter((session) =>
    ["PRESENT", "LATE"].includes(session.attendance_status || ""),
  ).length;
  const gradedAssessments = assessments.filter(
    (assessment) => assessment.result && assessment.result !== "PENDING" && assessment.percentage !== null,
  );
  const averageScore = gradedAssessments.length
    ? Math.round(
        gradedAssessments.reduce((sum, assessment) => sum + Number(assessment.percentage || 0), 0) /
          gradedAssessments.length,
      )
    : null;
  const passMark = assessments.length
    ? Math.min(...assessments.map((assessment) => Number(assessment.pass_mark) || 0).filter((mark) => mark > 0))
    : null;
  const attendanceRate = sessions.length ? Math.round((attendedSessions / sessions.length) * 100) : null;
  const trainers = useMemo(() => {
    const seen = new Map<string, { name: string; detail: string | null }>();
    (detail?.sessions || []).forEach((session) => {
      if (!session.trainer_name) return;
      const key = session.trainer_name.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, {
          name: session.trainer_name,
          detail: session.specialization || session.qualification || null,
        });
      }
    });
    return [...seen.values()];
  }, [detail]);

  const continuePayment = async () => {
    if (!course || !enrollment?.pending_payment) {
      toast.error("Payment method is unavailable for this checkout.", {
        description: "Open the course catalog or contact the training team for help.",
      });
      return;
    }
    setContinuingPayment(true);
    try {
      const checkout = await initializeCoursePayment(course.id);
      const url = new URL(checkout.authorization_url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.paystack.com") {
        throw new Error("Paystack returned an invalid checkout address.");
      }
      window.location.assign(url.toString());
    } catch (cause) {
      toast.error("Could not resume payment", {
        description: cause instanceof Error ? cause.message : "Please try again or contact the training team.",
      });
      setContinuingPayment(false);
    }
  };

  const downloadReceipt = async () => {
    const reference = enrollment?.paid_payment?.transaction_reference;
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

  if (loading) {
    return (
      <AdminPageShell withSidebar searchPlaceholder="Search your trainings...">
        <main className="page-padding min-h-screen">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
            <div className="h-10 w-72 animate-pulse rounded-lg bg-muted" />
            <div className="h-16 animate-pulse rounded-xl bg-muted" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl bg-muted" />)}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="h-96 animate-pulse rounded-xl bg-muted lg:col-span-7" />
              <div className="h-96 animate-pulse rounded-xl bg-muted lg:col-span-5" />
            </div>
          </div>
        </main>
      </AdminPageShell>
    );
  }

  if (error || !detail || !course || !enrollment) {
    return (
      <AdminPageShell withSidebar searchPlaceholder="Search your trainings...">
        <main className="page-padding min-h-screen">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
              <AlertCircle className="h-6 w-6" />
            </span>
            <h1 className="mt-4 text-lg font-bold">{error || "Training not found"}</h1>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              This training may have been removed, or you may not be registered for it.
            </p>
            <Link
              to="/training/trainee-dashboard"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <ArrowLeft className="h-4 w-4" /> Back to My Trainings
            </Link>
          </div>
        </main>
      </AdminPageShell>
    );
  }

  const trainingStatus = enrollment.training_status;
  const pendingPayment = enrollment.pending_payment;
  const paidPayment = enrollment.paid_payment;
  const sponsored = Boolean(enrollment.sponsor);
  const certificateUrl = activeCertificate?.pdf_url || null;
  const registrationRef =
    enrollment.enrollment_number || batch?.batch_code || course.code || `TRN-${course.id}`;
  const courseFee = formatMoney(course.price, course.currency);
  const paidAmount = paidPayment ? formatMoney(paidPayment.amount, paidPayment.currency || course.currency) : null;
  const pendingAmount = pendingPayment ? formatKobo(pendingPayment.amount_kobo, course.currency) : null;

  const metricCards: {
    label: string;
    icon: LucideIcon;
    iconClass: string;
    value: string;
    hint: string;
    hintClass?: string;
  }[] = [
    {
      label: "Training Status",
      icon: Play,
      iconClass: "bg-emerald-100 text-emerald-700",
      value: statusLabel(trainingStatus),
      hint: `${completedModules}/${modules.length} modules · ${enrollment.completion_percentage}% complete`,
      hintClass: "text-emerald-700",
    },
    {
      label: "Attendance",
      icon: Clock3,
      iconClass: "bg-muted text-muted-foreground",
      value: sessions.length ? `${attendedSessions} / ${sessions.length}` : "—",
      hint: attendanceRate !== null ? `${attendanceRate}% attendance rate` : "No sessions scheduled",
    },
    {
      label: "Assessment Score",
      icon: ClipboardCheck,
      iconClass: "bg-amber-100 text-amber-700",
      value: averageScore !== null ? `${averageScore}% avg` : "—",
      hint: passMark !== null ? `Passing mark ≥ ${passMark}%` : "No assessments graded yet",
      hintClass: "text-amber-700",
    },
    {
      label: "Certificate Status",
      icon: Award,
      iconClass: "bg-emerald-100 text-emerald-700",
      value: activeCertificate ? "Issued" : trainingStatus === "COMPLETED" ? "Processing" : "Pending",
      hint: activeCertificate
        ? activeCertificate.certificate_number
        : pendingPayment
          ? "Complete payment to proceed"
          : batch?.end_date
            ? `Expected after ${formatDate(batch.end_date)}`
            : "Awarded on completion",
    },
  ];

  return (
    <AdminPageShell withSidebar searchPlaceholder="Search your trainings...">
      <main className="page-padding min-h-screen">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col">
          {/* Breadcrumb + header */}
          <div className="flex flex-col gap-4 pb-5">
            <nav className="flex items-center gap-1 text-xs font-medium text-muted-foreground" aria-label="Breadcrumb">
              <Link to="/training/trainee-dashboard" className="transition-colors hover:text-primary">My Trainings</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-semibold text-foreground">{registrationRef}</span>
            </nav>

            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {course.category && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      {course.category}
                    </span>
                  )}
                  {sponsored && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      <Landmark className="h-3.5 w-3.5" />
                      {enrollment.sponsor?.name || "Sponsored"}
                    </span>
                  )}
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold ${statusStyles(trainingStatus)}`}>
                    {statusLabel(trainingStatus)}
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                  {course.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Registration ref: <span className="font-semibold text-primary">{registrationRef}</span>
                  {" · "}Candidate: <span className="font-semibold text-foreground">{name}</span>
                  {enrollment.trainee?.trainee_number ? ` (${enrollment.trainee.trainee_number})` : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/training/trainee-dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted/70"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to My Trainings
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
                >
                  <Headset className="h-4 w-4" /> Contact support
                </Link>
                {certificateUrl ? (
                  <a
                    href={certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                  >
                    <Download className="h-4 w-4" /> Download certificate (PDF)
                  </a>
                ) : activeCertificate ? (
                  <Link
                    to="/training/verify"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                  >
                    <Award className="h-4 w-4" /> View certificate
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          {pendingPayment && (
            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Payment required to confirm your seat</p>
                  <p className="text-xs text-amber-800">
                    {pendingAmount ? `${pendingAmount} outstanding` : "An outstanding balance"} — your registration is not confirmed until checkout is complete.
                    {pendingPayment.reference ? ` Ref: ${pendingPayment.reference}` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void continuePayment()}
                disabled={continuingPayment}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-800 disabled:cursor-wait disabled:opacity-60"
              >
                <CreditCard className="h-4 w-4" /> {continuingPayment ? "Connecting…" : "Complete payment"}
              </button>
            </div>
          )}

          {/* Metric strip */}
          <section aria-label="Training metrics" className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((metric) => (
              <article key={metric.label} className="flex flex-col justify-between rounded-xl border border-border/60 bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{metric.label}</span>
                  <span className={`grid h-9 w-9 place-items-center rounded-lg ${metric.iconClass}`}>
                    <metric.icon className="h-[18px] w-[18px]" />
                  </span>
                </div>
                <div className="my-3">
                  <div className="text-xl font-extrabold tracking-tight text-foreground">{metric.value}</div>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${metric.hintClass || "text-muted-foreground"}`}>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span className="truncate">{metric.hint}</span>
                </div>
              </article>
            ))}
          </section>

          {/* Master split */}
          <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left column */}
            <div className="flex flex-col gap-6 lg:col-span-7">
              {/* Logistics */}
              <section className="flex flex-col gap-5 rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
                <CardHeader
                  icon={Anchor}
                  iconClass="bg-emerald-100 text-emerald-700"
                  title="Course & Batch Logistics"
                  subtitle="Schedule, venue and delivery details"
                  badge={batch?.batch_code ? (
                    <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-bold text-foreground">{batch.batch_code}</span>
                  ) : undefined}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Fact label="Category" value={course.category || "General"} hint={course.tier || undefined} />
                  <Fact
                    label="Cohort Timetable"
                    value={batch ? formatDateRange(batch.start_date, batch.end_date) : "Self-paced enrollment"}
                    hint={batch?.delivery_mode ? `${batch.delivery_mode.toLowerCase()} delivery` : formatDuration(course) || undefined}
                  />
                  {batch && (
                    <Fact
                      label="Registration window"
                      value={formatRegWindow(batch.registration_start_date, batch.registration_end_date)}
                    />
                  )}
                  <div className="sm:col-span-2">
                    <Fact
                      label="Training Location"
                      value={batch?.location || (course.delivery_mode ? `${course.delivery_mode} delivery` : "Location to be confirmed")}
                      hint={batch?.capacity ? `Batch capacity: ${batch.capacity} trainees` : undefined}
                    />
                  </div>
                  {course.duration_value ? (
                    <Fact label="Duration" value={formatDuration(course) || ""} hint={course.code || undefined} />
                  ) : course.code ? (
                    <Fact label="Course Code" value={course.code} />
                  ) : null}
                </div>

                {(trainers.length > 0 || enrollment.sponsor || enrollment.engagement) && (
                  <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
                    {trainers.length > 0 && (
                      <>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Assigned trainers</span>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {trainers.map((trainer) => (
                            <div key={trainer.name} className="flex items-center gap-3 rounded-lg bg-muted/60 p-3">
                              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground">
                                {initials(trainer.name)}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">{trainer.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{trainer.detail || "Course trainer"}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {(enrollment.sponsor || enrollment.engagement) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {enrollment.sponsor && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                            <Landmark className="h-3.5 w-3.5" /> Sponsored by {enrollment.sponsor.name}
                          </span>
                        )}
                        {enrollment.engagement?.reference_number && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                            <IdCard className="h-3.5 w-3.5" /> {enrollment.engagement.reference_number}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Curriculum: sessions + modules */}
              <section className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
                <CardHeader
                  icon={Workflow}
                  iconClass="bg-primary/10 text-primary"
                  title="Curriculum & Schedule"
                  subtitle={`${completedModules} of ${modules.length} modules completed`}
                  badge={
                    <span className="text-xs font-bold text-emerald-700">
                      {sessions.filter((s) => ["PRESENT", "LATE"].includes(s.attendance_status || "")).length}/{sessions.length} sessions attended
                    </span>
                  }
                />

                {sessions.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Batch sessions</span>
                    {sessions.map((session) => (
                      <SessionRow key={session.id} session={session} />
                    ))}
                  </div>
                )}

                {modules.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Course modules</span>
                    {modules.map((module, index) => (
                      <ModuleRow key={module.id} module={module} index={index} />
                    ))}
                  </div>
                )}

                {!modules.length && !sessions.length && (
                  <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                    The curriculum for this training has not been published yet. Check back closer to your start date.
                  </p>
                )}
              </section>

              {/* Registration & delegate details */}
              <section className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
                <CardHeader
                  icon={IdCard}
                  iconClass="bg-muted text-foreground"
                  title="Registration & Delegate Details"
                  subtitle="Your enrollment record"
                  badge={activeCertificate ? <ShieldCheck className="h-5 w-5 text-emerald-600" /> : undefined}
                />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Fact label="Candidate Name" value={name} hint={enrollment.trainee?.occupation || undefined} />
                  <Fact
                    label="Trainee ID"
                    value={enrollment.trainee?.trainee_number || "—"}
                    hint={enrollment.trainee?.trainee_number ? "Profile verified" : undefined}
                  />
                  <Fact
                    label="Enrollment Reference"
                    value={enrollment.enrollment_number || registrationRef}
                    hint={enrollment.enrolled_at ? `Enrolled ${formatDate(enrollment.enrolled_at)}` : undefined}
                  />
                  <Fact
                    label="Funding"
                    value={enrollment.sponsor ? `${enrollment.sponsor.name} sponsored` : "Self-funded"}
                    hint={enrollment.source_type ? `Source: ${enrollment.source_type.toLowerCase()}` : undefined}
                  />
                </div>
                {course.description && (
                  <p className="border-t border-border/60 pt-4 text-sm leading-6 text-muted-foreground">
                    {course.description}
                  </p>
                )}
              </section>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-6 lg:col-span-5">
              {/* Credential card */}
              <section className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Training Credential</span>
                  {activeCertificate ? (
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">VERIFIED</span>
                  ) : pendingPayment ? (
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">PAYMENT PENDING</span>
                  ) : (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">IN TRAINING</span>
                  )}
                </div>
                <div className="relative overflow-hidden rounded-xl bg-muted/60 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-lg font-extrabold text-primary-foreground">
                        G
                      </span>
                      <div>
                        <p className="text-sm font-extrabold leading-tight text-foreground">GOKLY TRAINING</p>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {batch?.batch_code ? `${batch.batch_code} Record` : "Enrollment Record"}
                        </p>
                      </div>
                    </div>
                    <ShieldCheck className="h-7 w-7 text-primary" />
                  </div>
                  <div className="mt-5 flex items-center gap-4">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-card shadow-sm">
                      <img src={getCourseImage(course)} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-primary/90 py-0.5 text-center text-[9px] font-bold text-primary-foreground">
                        {activeCertificate ? "CERTIFIED" : "ACTIVE"}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">{name}</p>
                      <p className="text-xs font-semibold text-primary">
                        {enrollment.trainee?.trainee_number || registrationRef}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {batch?.name || course.title}
                      </p>
                      {activeCertificate?.verification_code && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded bg-card px-1.5 py-0.5 font-mono text-[11px] font-bold text-foreground">
                          <Nfc className="h-3 w-3" /> {activeCertificate.verification_code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {certificateUrl && (
                  <a
                    href={certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted/70"
                  >
                    <Download className="h-4 w-4" /> Download certificate (PDF)
                  </a>
                )}
                {!certificateUrl && activeCertificate && (
                  <Link
                    to="/training/verify"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted/70"
                  >
                    <BadgeCheck className="h-4 w-4" /> Verify certificate
                  </Link>
                )}
              </section>

              {/* Sponsorship & billing */}
              <section className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-foreground">
                      <Landmark className="h-[18px] w-[18px]" />
                    </span>
                    <h2 className="text-base font-bold tracking-tight text-foreground">Sponsorship & Billing</h2>
                  </div>
                  <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${sponsored ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
                    {sponsored ? "Sponsored" : "Self-funded"}
                  </span>
                </div>
                <div className="flex flex-col divide-y divide-border/60">
                  {enrollment.sponsor && (
                    <div className="flex items-center justify-between gap-3 py-2.5">
                      <span className="text-xs font-medium text-muted-foreground">Sponsoring Organization</span>
                      <span className="text-sm font-semibold text-foreground">{enrollment.sponsor.name}</span>
                    </div>
                  )}
                  {courseFee && (
                    <div className="flex items-center justify-between gap-3 py-2.5">
                      <span className="text-xs font-medium text-muted-foreground">Course Valuation</span>
                      <span className={`text-sm font-bold ${paidAmount || sponsored ? "text-emerald-700" : "text-foreground"}`}>
                        {courseFee}
                      </span>
                    </div>
                  )}
                  {paidAmount && (
                    <div className="flex items-center justify-between gap-3 py-2.5">
                      <span className="text-xs font-medium text-muted-foreground">Amount Paid</span>
                      <span className="text-sm font-bold text-emerald-700">{paidAmount}</span>
                    </div>
                  )}
                  {pendingAmount && (
                    <div className="flex items-center justify-between gap-3 py-2.5">
                      <span className="text-xs font-medium text-muted-foreground">Outstanding</span>
                      <span className="text-sm font-bold text-amber-700">{pendingAmount}</span>
                    </div>
                  )}
                  {paidPayment?.transaction_reference && (
                    <div className="flex items-center justify-between gap-3 py-2.5">
                      <span className="text-xs font-medium text-muted-foreground">Payment Reference</span>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">{paidPayment.transaction_reference}</span>
                        <button
                          type="button"
                          onClick={() => void downloadReceipt()}
                          disabled={receiptLoading}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                          title="Download payment receipt (PDF)"
                        >
                          <Download className="h-3 w-3" />
                          {receiptLoading ? "Preparing…" : "Receipt"}
                        </button>
                      </span>
                    </div>
                  )}
                  {enrollment.engagement?.reference_number && (
                    <div className="flex items-center justify-between gap-3 py-2.5">
                      <span className="text-xs font-medium text-muted-foreground">Engagement / PO</span>
                      <span className="font-mono text-xs font-bold text-foreground">{enrollment.engagement.reference_number}</span>
                    </div>
                  )}
                </div>
                {sponsored && (
                  <div className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    <p className="text-xs leading-5 text-emerald-900">
                      This training is covered by {enrollment.sponsor?.name || "your sponsoring organization"}. No individual payment is required from you.
                    </p>
                  </div>
                )}
                {pendingPayment && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                    <p className="text-xs leading-5 text-amber-900">
                      Complete checkout to confirm your seat. You can resume payment at any time from this page.
                    </p>
                  </div>
                )}
              </section>

              {/* Certification readiness */}
              <section className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-amber-700">
                      <Award className="h-[18px] w-[18px]" />
                    </span>
                    <h2 className="text-base font-bold tracking-tight text-foreground">Certification Readiness</h2>
                  </div>
                  <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                    {activeCertificate ? "Issued" : statusLabel(trainingStatus)}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Target Credential</span>
                    <p className="mt-1 text-sm font-bold text-foreground">
                      {course.title} {course.certificate_enabled === false ? "" : "Certificate"}
                    </p>
                    {course.certificate_authority && (
                      <p className="mt-0.5 text-xs text-emerald-700">{course.certificate_authority}</p>
                    )}
                  </div>
                  <ReadinessRow
                    label="Module completion"
                    value={`${completedModules}/${modules.length}`}
                    complete={modules.length > 0 && completedModules === modules.length}
                  />
                  <ReadinessRow
                    label="Attendance"
                    value={attendanceRate !== null ? `${attendanceRate}%` : "No sessions"}
                    complete={attendanceRate !== null && attendanceRate >= 75}
                  />
                  <ReadinessRow
                    label="Assessment average"
                    value={averageScore !== null ? `${averageScore}%` : "Not graded"}
                    complete={averageScore !== null && passMark !== null && averageScore >= passMark}
                    hint={passMark !== null ? `Pass mark ≥ ${passMark}%` : undefined}
                  />
                  <ReadinessRow
                    label="Certificate"
                    value={activeCertificate ? activeCertificate.certificate_number : trainingStatus === "COMPLETED" ? "Processing" : "Pending"}
                    complete={Boolean(activeCertificate)}
                  />
                </div>
                {activeCertificate && (
                  <Link
                    to="/training/verify"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/15"
                  >
                    <BadgeCheck className="h-4 w-4" /> View certificate
                  </Link>
                )}
              </section>

              {/* Assessments detail */}
              {assessments.length > 0 && (
                <section className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
                  <CardHeader
                    icon={ClipboardCheck}
                    iconClass="bg-amber-100 text-amber-700"
                    title="Assessments"
                    subtitle="Theory, practical and final evaluations"
                  />
                  <div className="flex flex-col gap-2">
                    {assessments.map((assessment) => (
                      <AssessmentRow key={assessment.id} assessment={assessment} />
                    ))}
                  </div>
                </section>
              )}

              {/* Support */}
              <section className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Need Help?</span>
                <p className="text-sm leading-6 text-muted-foreground">
                  Questions about your schedule, attendance, or certificate? Our training team can help.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    to="/contact"
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted/70"
                  >
                    <Headset className="h-4 w-4" /> Contact support
                  </Link>
                  <a
                    href="tel:+23484992001"
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
                  >
                    <Phone className="h-4 w-4" /> Call training desk
                  </a>
                </div>
              </section>
            </div>
          </div>

          <p className="mb-3 text-center text-xs text-muted-foreground">
            {certificates.length} certificate{certificates.length === 1 ? "" : "s"} on record for this training
          </p>
        </div>
      </main>
    </AdminPageShell>
  );
}

function SessionRow({ session }: { session: TraineeTrainingSession }) {
  const attended = ["PRESENT", "LATE"].includes(session.attendance_status || "");
  const missed = session.attendance_status === "ABSENT" || session.attendance_status === "EXCUSED";
  const date = formatDate(session.session_date);
  const start = formatTime(session.start_time);
  const end = formatTime(session.end_time);
  const isPast = new Date(session.session_date).getTime() < Date.now();

  return (
    <div className={`flex items-start gap-3 rounded-xl p-3.5 ${attended ? "bg-emerald-50/70" : missed ? "bg-red-50/60" : isPast ? "bg-muted/60" : "bg-muted/40"}`}>
      <span
        className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
          attended ? "bg-emerald-600 text-white" : missed ? "bg-red-500 text-white" : "bg-card text-muted-foreground ring-1 ring-border"
        }`}
      >
        {attended ? <CheckCircle2 className="h-4 w-4" /> : missed ? <Lock className="h-3.5 w-3.5" /> : <CalendarDays className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{session.title}</p>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
              attended
                ? "bg-emerald-100 text-emerald-800"
                : missed
                  ? "bg-red-100 text-red-800"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {attended ? "Attended" : missed ? "Missed" : isPast ? "No record" : "Upcoming"}
          </span>
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{date}</span>
          {start && end && <span className="inline-flex items-center gap-1"><Timer className="h-3 w-3" />{start} – {end}</span>}
          {session.trainer_name && <span className="inline-flex items-center gap-1"><GraduationCap className="h-3 w-3" />{session.trainer_name}</span>}
          {session.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{session.location}</span>}
        </p>
      </div>
    </div>
  );
}

function ModuleRow({ module, index }: { module: TraineeTrainingModule; index: number }) {
  const progress = moduleProgress(module);
  const pct = Number(module.progress_percentage || 0);
  const assessmentScore = module.assessment_score !== null ? Number(module.assessment_score) : null;

  return (
    <div className={`rounded-xl p-4 ${progress.state === "active" ? "bg-primary/[0.06] ring-1 ring-primary/20" : progress.state === "done" ? "bg-emerald-50/60" : "bg-muted/40"}`}>
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
            progress.state === "done"
              ? "bg-emerald-600 text-white"
              : progress.state === "active"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground ring-1 ring-border"
          }`}
        >
          {progress.state === "done" ? <CheckCircle2 className="h-4 w-4" /> : progress.state === "active" ? <Play className="h-3.5 w-3.5" /> : <span className="text-xs font-bold">{index + 1}</span>}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={`text-sm font-semibold ${progress.state === "active" ? "text-primary" : "text-foreground"}`}>
              Module {index + 1}: {module.title}
            </p>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                progress.state === "done"
                  ? "bg-emerald-100 text-emerald-800"
                  : progress.state === "active"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {progress.label}
              {progress.detail ? ` · ${progress.detail}` : ""}
            </span>
          </div>
          {module.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{module.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {module.scheduled_date && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{formatDate(module.scheduled_date)}</span>}
            {module.duration ? <span className="inline-flex items-center gap-1"><Timer className="h-3 w-3" />{module.duration} min</span> : null}
            {module.has_assessment && (
              <span className="inline-flex items-center gap-1">
                <ClipboardCheck className="h-3 w-3" />
                {assessmentScore !== null
                  ? `Assessment: ${assessmentScore}% ${module.assessment_passed ? "· Passed" : "· Failed"}`
                  : `Assessment${module.assessment_pass_mark ? ` (pass ≥ ${module.assessment_pass_mark}%)` : ""}`}
              </span>
            )}
            {progress.state !== "done" && progress.pct > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-primary">{Math.round(pct)}% complete</span>
            )}
          </div>
          {module.materials && module.materials.length > 0 && (
            <div className="mt-2.5 flex flex-col gap-1.5">
              {module.materials.map((material, materialIndex) => {
                const url = materialDownloadUrl(material);
                if (!url) return null;
                return (
                  <a
                    key={`${material.name}-${materialIndex}`}
                    href={url}
                    download={material.name}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit max-w-full items-center gap-2 rounded-lg border border-border/60 bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate">{material.name}</span>
                    <Download className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function materialDownloadUrl(material: { url?: string | null }): string | null {
  const url = material?.url;
  if (!url) return null;
  // Cloudinary delivery URLs ignore the `download` attribute cross-origin;
  // fl_attachment forces a real download with the original filename.
  if (url.includes("res.cloudinary.com") && url.includes("/upload/") && !url.includes("fl_attachment")) {
    return url.replace("/upload/", "/upload/fl_attachment/");
  }
  return url;
}

function ReadinessRow({
  label,
  value,
  complete,
  hint,
}: {
  label: string;
  value: string;
  complete: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-right">
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
        <span className={`text-xs font-bold ${complete ? "text-emerald-700" : "text-foreground"}`}>{value}</span>
        {complete ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Clock3 className="h-4 w-4 text-muted-foreground" />}
      </span>
    </div>
  );
}

function AssessmentRow({ assessment }: { assessment: TraineeTrainingAssessment }) {
  const percentage = assessment.percentage !== null ? Number(assessment.percentage) : null;
  const passed = assessment.result === "PASS";
  const failed = assessment.result === "FAIL";
  const pending = !assessment.result || assessment.result === "PENDING";

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{assessment.title}</p>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {assessment.type.toLowerCase()} · pass ≥ {Number(assessment.pass_mark)}%
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
          passed ? "bg-emerald-100 text-emerald-800" : failed ? "bg-red-100 text-red-800" : "bg-muted text-muted-foreground"
        }`}
      >
        {pending ? "Pending" : `${percentage}% · ${assessment.result}`}
      </span>
    </div>
  );
}
