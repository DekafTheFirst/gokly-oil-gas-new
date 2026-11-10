import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MapPin,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { fetchTraineeDashboard, type TraineeDashboardCourse } from "@/lib/trainee-dashboard";

type CourseFilter = "all" | "active" | "completed";

const metrics: { label: string; icon: LucideIcon; tone: string }[] = [
  { label: "Active courses", icon: GraduationCap, tone: "text-primary" },
  { label: "Completed courses", icon: CheckCircle2, tone: "text-blue-700" },
  { label: "Active certificates", icon: Award, tone: "text-amber-600" },
  { label: "Attendance", icon: CalendarDays, tone: "text-emerald-700" },
];

function displayName(user: { first_name?: string; last_name?: string; name?: string; email?: string } | null | undefined) {
  if (!user) return "Trainee";
  const full = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (user.name) return user.name;
  if (user.email) return user.email.split("@")[0];
  return "Trainee";
}

function isCompleted(course: TraineeDashboardCourse) {
  return Boolean(course.completed_at) || course.enrollment_status?.toUpperCase() === "COMPLETED";
}

function isCancelled(course: TraineeDashboardCourse) {
  return ["CANCELLED", "WITHDRAWN", "REJECTED"].includes(course.enrollment_status?.toUpperCase() || "");
}

function isActive(course: TraineeDashboardCourse) {
  return !isCompleted(course) && !isCancelled(course);
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
  return formattedStart || formattedEnd || "Schedule not set";
}

function formatAttendance(attended: number, records: number) {
  if (!records) return "No records yet";
  return `${Math.round((attended / records) * 100)}%`;
}

export default function Dashboard() {
  const { user } = useAuth() as {
    user: { first_name?: string; last_name?: string; name?: string; email?: string; id?: number } | null;
  };
  const [courseFilter, setCourseFilter] = useState<CourseFilter>("all");
  const [courses, setCourses] = useState<TraineeDashboardCourse[]>([]);
  const [activeCertificates, setActiveCertificates] = useState(0);
  const [traineeNumber, setTraineeNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
        setTraineeNumber(summary.trainee_number);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Could not load your training dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  const completedCourses = useMemo(() => courses.filter(isCompleted), [courses]);
  const activeCourses = useMemo(() => courses.filter(isActive), [courses]);
  const visibleCourses = courses.filter((course) => {
    if (courseFilter === "completed") return isCompleted(course);
    if (courseFilter === "active") return isActive(course);
    return true;
  });
  const totalAttendanceRecords = courses.reduce((sum, course) => sum + course.attendance_records, 0);
  const totalAttendedRecords = courses.reduce((sum, course) => sum + course.attended_records, 0);
  const featuredCourse = activeCourses[0];
  const metricValues = [
    { value: String(activeCourses.length), detail: "Currently in progress" },
    { value: String(completedCourses.length), detail: "Completed enrollments" },
    { value: String(activeCertificates), detail: "Issued and active" },
    { value: formatAttendance(totalAttendedRecords, totalAttendanceRecords), detail: totalAttendanceRecords ? `${totalAttendedRecords} of ${totalAttendanceRecords} sessions attended` : "Attendance has not been recorded" },
  ];

  return (
    <AdminPageShell withSidebar searchPlaceholder="Search your training records...">
      <div className="page-padding space-y-6">
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-card sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Trainee dashboard</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Welcome back, {name}</h1>
              <p className="mt-2 text-muted-foreground">
                Your course enrollments, learning progress, attendance, and certificates.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-muted/60 p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-card text-primary">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Trainee profile</p>
                  <p className="text-sm text-muted-foreground">Keep your credentials and contact details up to date.</p>
                </div>
                <Link to="/profile" className="text-sm font-semibold text-primary hover:underline">
                  Review profile
                </Link>
              </div>
            </div>
            <Link
              to="/training/courses"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <BookOpen className="h-4 w-4" />
              Browse course catalog
            </Link>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
            {error}
          </div>
        )}

        <section aria-label="Training overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <article key={metric.label} className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{metric.label}</p>
                <metric.icon className={`h-5 w-5 shrink-0 ${metric.tone}`} aria-hidden="true" />
              </div>
              <p className={`mt-4 text-2xl font-bold ${metric.tone}`}>
                {loading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-muted" /> : metricValues[index].value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{loading ? "Loading your records…" : metricValues[index].detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-12">
          <article className="min-w-0 rounded-xl border border-border/70 bg-card p-5 shadow-sm md:col-span-8 sm:p-6">
            {featuredCourse ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">In progress</span>
                    {featuredCourse.batch_code && (
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{featuredCourse.batch_code}</span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{featuredCourse.delivery_mode || "Delivery to be confirmed"}</span>
                </div>
                <h2 className="mt-4 text-xl font-bold sm:text-2xl">{featuredCourse.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {featuredCourse.batch_name || featuredCourse.category}
                </p>

                <div className="mt-5 flex flex-col gap-4 rounded-xl bg-muted/50 p-4 sm:flex-row sm:items-center">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <CalendarDays className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Training schedule</p>
                    <h3 className="mt-1 font-semibold">{formatDateRange(featuredCourse.start_date, featuredCourse.end_date)}</h3>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {featuredCourse.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" />{featuredCourse.location}</span>}
                      {featuredCourse.duration_value && <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-primary" />{featuredCourse.duration_value} {featuredCourse.duration_unit?.toLowerCase() || "hours"}</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold">Course progress</span>
                    <span className="font-bold text-primary">{featuredCourse.completion_percentage}%</span>
                  </div>
                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-label={`${featuredCourse.title} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={featuredCourse.completion_percentage}
                  >
                    <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${featuredCourse.completion_percentage}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {featuredCourse.completed_modules} of {featuredCourse.total_modules} modules completed
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3 border-t border-border/70 pt-5">
                  <Link to={`/training/courses/${featuredCourse.course_id}`} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                    <BookOpen className="h-4 w-4" /> Open course <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                  <GraduationCap className="h-7 w-7" />
                </span>
                <h2 className="mt-4 text-xl font-bold">{loading ? "Loading your enrollments…" : "No active courses yet"}</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  {loading ? "Your current course information will appear here." : "When you enroll in a course, your progress and schedule will appear here."}
                </p>
                {!loading && (
                  <Link to="/training/courses" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                    Browse course catalog <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            )}
          </article>

          <aside className="min-w-0 rounded-xl border border-border/70 bg-card p-5 shadow-sm md:col-span-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold">Trainee profile</h2>
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">Account details</span>
            </div>
            <div className="mt-4 flex flex-col items-center rounded-xl bg-muted/50 p-5 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground">
                <UserRound className="h-8 w-8" />
              </div>
              <h3 className="mt-3 text-lg font-bold">{name}</h3>
              <p className="break-all text-sm text-muted-foreground">{user?.email || "Email not available"}</p>
              <div className="mt-4 w-full rounded-lg bg-card px-3 py-3 text-left">
                <p className="text-xs font-medium text-muted-foreground">Trainee number</p>
                <p className="mt-1 text-sm font-semibold">{loading ? "Loading…" : traineeNumber || "Not assigned"}</p>
              </div>
            </div>
            <Link to="/profile" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm font-semibold hover:bg-muted/70">
              Review profile <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-bold">Your course enrollments</h2>
              <p className="mt-1 text-sm text-muted-foreground">Current and completed courses recorded on your account.</p>
            </div>
            <div className="admin-segmented" aria-label="Filter courses">
              {([
                { id: "all", label: `All (${courses.length})` },
                { id: "active", label: `In progress (${activeCourses.length})` },
                { id: "completed", label: `Completed (${completedCourses.length})` },
              ] as const).map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  data-active={courseFilter === filter.id}
                  aria-pressed={courseFilter === filter.id}
                  onClick={() => setCourseFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="admin-table min-w-[700px]">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Training dates</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Loading your enrollments…</td></tr>
                ) : visibleCourses.map((course) => {
                  const completed = isCompleted(course);
                  const cancelled = isCancelled(course);
                  return (
                    <tr key={`${course.course_id}-${course.enrollment_id ?? "legacy"}`}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                            <BookOpen className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <div>
                            <p className="font-semibold">{course.code || course.category}</p>
                            <p className="text-sm text-muted-foreground">{course.title}</p>
                            {course.batch_name && <p className="text-xs text-muted-foreground">{course.batch_name}</p>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="font-medium">{formatDateRange(course.start_date, course.end_date)}</p>
                        {course.location && <p className="text-xs text-muted-foreground">{course.location}</p>}
                      </td>
                      <td>
                        <p className="font-medium">{course.completion_percentage}%</p>
                        <p className="text-xs text-muted-foreground">{course.completed_modules}/{course.total_modules} modules</p>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${completed ? "bg-muted text-foreground" : cancelled ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                          {completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                          {completed ? "Completed" : cancelled ? course.enrollment_status?.toLowerCase() : "In progress"}
                        </span>
                        {course.active_certificates > 0 && (
                          <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                            <Award className="h-3.5 w-3.5" /> Certificate issued
                          </p>
                        )}
                      </td>
                      <td className="text-right">
                        {course.active_certificates > 0 ? (
                          <Link to="/training/verify" className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-muted px-3 py-2 text-xs font-semibold hover:bg-muted/70">
                            <ShieldCheck className="h-3.5 w-3.5" /> Certificate
                          </Link>
                        ) : (
                          <Link to={`/training/courses/${course.course_id}`} className="inline-flex whitespace-nowrap rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                            View course
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!loading && !error && visibleCourses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center">
                      <p className="font-semibold">{courses.length ? "No courses in this filter" : "No course enrollments found"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {courses.length ? "Choose another filter to see your enrollments." : "Enroll in a course to see it listed here."}
                      </p>
                      {!courses.length && (
                        <Link to="/training/courses" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                          Browse course catalog <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
