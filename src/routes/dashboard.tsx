import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  GraduationCap,
  HeartPulse,
  MapPin,
  ShieldCheck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AdminPageShell } from "@/components/educert/AdminPageShell";

type CourseStatus = "active" | "completed";
type Course = {
  code: string;
  title: string;
  cohort: string;
  dates: string;
  location: string;
  accreditor: string;
  status: CourseStatus;
  result: string;
  note?: string;
  icon: LucideIcon;
};

const courses: Course[] = [
  {
    code: "IWCF-L4-SUBSEA",
    title: "IWCF Level 4 Well Control (Subsea Stack)",
    cohort: "SNEPCo Bonga Deepwater Crew",
    dates: "03 Mar – 07 Mar 2025",
    location: "Gokly Subsea Simulator Bay",
    accreditor: "IWCF Scotland",
    status: "active",
    result: "In Progress (60%)",
    icon: BookOpen,
  },
  {
    code: "OPITO-5700",
    title: "BOSIET with Emergency Breathing System (EBS)",
    cohort: "Certificate Ref: OP-2023-88219",
    dates: "12 Feb – 15 Feb 2023",
    location: "Offshore Survival Basin",
    accreditor: "OPITO Approved",
    status: "completed",
    result: "Completed (Grade A)",
    note: "Refresher due",
    icon: ShieldCheck,
  },
  {
    code: "MISTDO-NUPRC",
    title: "MISTDO Basic Offshore Safety Induction",
    cohort: "NUPRC Ref: NUP-MIS-2024-401",
    dates: "2024",
    location: "Gokly Training Centre",
    accreditor: "NUPRC",
    status: "completed",
    result: "Certified",
    icon: BadgeCheck,
  },
  {
    code: "HSE-CS-04",
    title: "Confined Space Entry & Breathing Apparatus Rescue",
    cohort: "NOGIC Ref: NCDMB-TR-0914",
    dates: "18 Nov – 20 Nov 2024",
    location: "Industrial Practical Rig Tower",
    accreditor: "NCDMB / Gokly",
    status: "completed",
    result: "Certified",
    icon: UsersRound,
  },
];

const metrics: { label: string; value: string; detail: string; icon: LucideIcon; tone: string }[] = [
  { label: "Active enrollment", value: "1 module", detail: "IWCF Level 4 · Day 3 of 5", icon: GraduationCap, tone: "text-primary" },
  { label: "Historical courses", value: "3 cleared", detail: "100% aggregate attendance", icon: CheckCircle2, tone: "text-blue-700" },
  { label: "Certificates", value: "3 active", detail: "One refresher due", icon: Award, tone: "text-amber-600" },
  { label: "Gate clearance", value: "Cleared", detail: "Biometrics & yard access", icon: ShieldCheck, tone: "text-emerald-700" },
];

function displayName(user: { first_name?: string; last_name?: string; name?: string; email?: string } | null | undefined) {
  if (!user) return "Trainee";
  const full = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (user.name) return user.name;
  if (user.email) return user.email.split("@")[0];
  return "Trainee";
}

export default function Dashboard() {
  const { user } = useAuth() as { user: { first_name?: string; last_name?: string; name?: string; email?: string } | null };
  const [courseFilter, setCourseFilter] = useState<"all" | CourseStatus>("all");
  const name = displayName(user);
  const visibleCourses = courses.filter((course) => courseFilter === "all" || course.status === courseFilter);
  const activeCount = courses.filter((course) => course.status === "active").length;
  const completedCount = courses.length - activeCount;

  return (
    <AdminPageShell withSidebar searchPlaceholder="Search modules, drill guides, safety SOPs...">
      <div className="page-padding space-y-6">
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-card sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Trainee dashboard</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Welcome back, {name}</h1>
              <p className="mt-2 text-muted-foreground">
                Your training, certification records, and site-readiness information in one place.
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
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
              <Link
                to="/training/verify"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <ShieldCheck className="h-4 w-4" />
                Digital safety passport
              </Link>
              <Link
                to="/training/courses"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted/70"
              >
                <BookOpen className="h-4 w-4" />
                Browse course catalog
              </Link>
            </div>
          </div>
        </section>

        <section aria-label="Training overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article key={metric.label} className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{metric.label}</p>
                <metric.icon className={`h-5 w-5 shrink-0 ${metric.tone}`} aria-hidden="true" />
              </div>
              <p className={`mt-4 text-2xl font-bold capitalize ${metric.tone}`}>{metric.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{metric.detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-12">
          <article className="min-w-0 rounded-xl border border-border/70 bg-card p-5 shadow-sm md:col-span-8 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">In session</span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">BTCH-2025-012</span>
              </div>
              <span className="text-sm text-muted-foreground">Classroom theory + full-mission rig simulator</span>
            </div>
            <h2 className="mt-4 text-xl font-bold sm:text-2xl">Advanced Offshore Well Control &amp; Blowout Prevention</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Subsea and surface stack combination accreditation under the International Well Control Forum standard.
            </p>

            <div className="mt-5 flex flex-col gap-4 rounded-xl bg-muted/50 p-4 sm:flex-row sm:items-center">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next live session</p>
                <h3 className="mt-1 font-semibold">Module 4: Subsea BOP Acoustic &amp; Multiplex Actuation</h3>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-primary" />08:30–16:30 WAT</span>
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" />Simulator Yard Bay 3B</span>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold">Curriculum progression · Day 3 of 5</span>
                <span className="font-bold text-primary">60%</span>
              </div>
              <div
                className="h-2.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label="Curriculum progression"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={60}
              >
                <div className="h-full w-[60%] rounded-full bg-primary" />
              </div>
              <ol className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-5">
                {["Risk & barriers", "Kick detection", "Volumetric calculations", "Acoustic BOP (next)", "Practical exam"].map((item, index) => (
                  <li key={item} className={index < 3 ? "font-semibold text-primary" : ""}>
                    {index < 3 ? <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> : null}
                    {item}
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 border-t border-border/70 pt-5">
              <Link to="/training/courses" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                <FileText className="h-4 w-4" />
                Course handouts &amp; SOPs
              </Link>
              <Link to="/training/courses" className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-semibold hover:bg-muted/70">
                View course details <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>

          <aside className="min-w-0 rounded-xl border border-border/70 bg-card p-5 shadow-sm md:col-span-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold">Digital trainee ID</h2>
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">Training passport</span>
            </div>
            <div className="mt-4 flex flex-col items-center rounded-xl bg-muted/50 p-5 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground">
                <UserRound className="h-8 w-8" />
              </div>
              <h3 className="mt-3 text-lg font-bold">{name}</h3>
              <p className="text-sm text-muted-foreground">Trainee</p>
              <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-card px-3 py-2 text-sm font-semibold text-primary">
                <ShieldCheck className="h-4 w-4" />
                Site access status
                <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs">Active</span>
              </div>
            </div>
            <Link to="/training/verify" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm font-semibold hover:bg-muted/70">
              View credentials <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-bold">Training curriculum &amp; records</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Accredited drilling, maritime safety, and emergency response qualifications.
              </p>
            </div>
            <div className="admin-segmented" aria-label="Filter courses">
              {([
                { id: "all", label: `All courses (${courses.length})` },
                { id: "active", label: `Active (${activeCount})` },
                { id: "completed", label: `Completed (${completedCount})` },
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
            <table className="admin-table min-w-[760px]">
              <thead>
                <tr>
                  <th>Course code &amp; details</th>
                  <th>Training delivery</th>
                  <th>Accreditation</th>
                  <th>Status &amp; result</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleCourses.map((course) => (
                  <tr key={course.code}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                          <course.icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-semibold">{course.code}</p>
                          <p className="text-sm text-muted-foreground">{course.title}</p>
                          <p className="text-xs text-muted-foreground">{course.cohort}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="font-medium">{course.dates}</p>
                      <p className="text-xs text-muted-foreground">{course.location}</p>
                    </td>
                    <td>{course.accreditor}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${course.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-foreground"}`}>
                        {course.status === "active" ? <Clock3 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        {course.result}
                      </span>
                      {course.note && <p className="mt-1 text-xs font-medium text-amber-700">{course.note}</p>}
                    </td>
                    <td className="text-right">
                      {course.status === "active" ? (
                        <Link to="/training/courses" className="inline-flex whitespace-nowrap rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                          Open course
                        </Link>
                      ) : (
                        <Link to="/training/verify" aria-label={`View ${course.code} certificate`} className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-muted px-3 py-2 text-xs font-semibold hover:bg-muted/70">
                          <Download className="h-3.5 w-3.5" /> Certificate
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-label="Compliance and support" className="grid gap-4 md:grid-cols-3">
          <StatusCard
            icon={ShieldCheck}
            title="NUPRC / NCDMB JQS sync"
            body="Industry qualification records are available for review in your certification profile."
            detail="Training record synchronization"
          />
          <StatusCard
            icon={HeartPulse}
            title="Medical clearance"
            body="Review your current fit-to-work clearance and renewal requirements."
            detail="Check your profile for current status"
          />
          <StatusCard
            icon={Award}
            title="Trainee support"
            body="Contact the training team for simulator equipment, logistics, or course-record assistance."
            detail="Support and registrar"
          />
        </section>
      </div>
    </AdminPageShell>
  );
}

function StatusCard({ icon: Icon, title, body, detail }: { icon: LucideIcon; title: string; body: string; detail: string }) {
  return (
    <article className="flex items-start gap-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        <p className="mt-3 text-xs font-medium text-muted-foreground">{detail}</p>
      </div>
    </article>
  );
}
