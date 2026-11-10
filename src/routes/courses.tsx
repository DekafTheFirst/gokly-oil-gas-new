import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  FilterX,
  GraduationCap,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { fetchMyEnrolledCourseIds, fetchPublicCourses, type CourseRecord } from "@/lib/courses";
import { filterCourseCatalog, type CourseCatalogEnrollmentFilter } from "@/lib/course-catalog";
import courseRigImage from "@/assets/course-rig.jpg";
import courseSubseaImage from "@/assets/course-subsea.jpg";
import courseHazmatImage from "@/assets/course-hazmat.jpg";

function getCourseImage(course: CourseRecord) {
  if (course.thumbnail_url || course.image) return course.thumbnail_url || course.image || "";
  const category = course.category?.toLowerCase() || "";
  if (category.includes("safety") || category.includes("hse")) return courseHazmatImage;
  if (category.includes("technical") || category.includes("engineering")) return courseRigImage;
  return courseSubseaImage;
}

function formatDuration(course: CourseRecord) {
  if (!course.duration_value) return null;
  const unit = course.duration_unit?.toLowerCase() || "hours";
  return `${course.duration_value} ${unit}`;
}

function formatPrice(course: CourseRecord) {
  const price = Number(course.price);
  if (Number.isFinite(price) && price === 0) return "Free";
  if (!Number.isFinite(price) || price < 0) return "Contact for pricing";

  const currency = ["NGN", "USD", "EUR", "GBP"].includes((course.currency || "").toUpperCase())
    ? (course.currency || "NGN").toUpperCase()
    : "NGN";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export default function Courses() {
  const { user } = useAuth() as { user: { id?: number; role?: string } | null };
  const location = useLocation();
  const isPortalRoute = location.pathname.startsWith("/training/");
  const role = (user?.role || "").toUpperCase();
  const canEnroll = role === "TRAINEE" || role === "STUDENT";
  const dashboardLink =
    role === "ADMIN"
      ? "/training/admin"
      : role === "TRAINER"
        ? "/training/trainer-dashboard"
        : "/training/trainee-dashboard";

  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<number>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [tier, setTier] = useState("all");
  const [enrollment, setEnrollment] = useState<CourseCatalogEnrollmentFilter>("all");

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setEnrolledCourseIds(new Set());
    Promise.all([
      fetchPublicCourses(),
      canEnroll ? fetchMyEnrolledCourseIds() : Promise.resolve([]),
    ])
      .then(([publishedCourses, enrolledIds]) => {
        if (!active) return;
        setCourses(publishedCourses);
        setEnrolledCourseIds(new Set(enrolledIds));
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Could not load courses. Please try again.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canEnroll, user?.id]);

  const categories = useMemo(
    () => [...new Set(courses.map((course) => course.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [courses],
  );
  const tiers = useMemo(
    () => [...new Set(courses.map((course) => course.tier).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b)),
    [courses],
  );
  const filteredCourses = useMemo(
    () => filterCourseCatalog(courses, { search, category, tier, enrollment }),
    [category, courses, enrollment, search, tier],
  );

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setTier("all");
    setEnrollment("all");
  };

  const content = (
    <main className={isPortalRoute ? "page-padding" : "min-h-screen bg-background"}>
      <div className={isPortalRoute ? "mx-auto max-w-[1440px] space-y-8" : "mx-auto max-w-[1440px] space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12"}>
        <section className="relative overflow-hidden rounded-2xl bg-primary-deep p-5 text-primary-foreground shadow-card sm:p-6">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/30 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(240px,0.7fr)] lg:items-center">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-2.5 py-1 text-[11px] font-semibold">
                  <BadgeCheck className="h-3.5 w-3.5 text-energy" /> Professional training
                </span>
                <span className="rounded-full bg-primary-foreground/10 px-2.5 py-1 text-[11px] font-semibold">Oil, gas &amp; safety</span>
              </div>
              <h1 className="mt-3 max-w-2xl text-2xl font-extrabold leading-tight sm:text-3xl">
                Find the right course for your next step.
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-primary-foreground/80">
                Browse accredited training by subject, level, and enrollment option.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {!user ? (
                  <Link to="/register" className="inline-flex items-center gap-2 rounded-lg bg-energy px-4 py-2.5 text-sm font-bold text-energy-foreground transition hover:brightness-95">
                    Create a trainee account <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link to={dashboardLink} className="inline-flex items-center gap-2 rounded-lg bg-energy px-4 py-2.5 text-sm font-bold text-energy-foreground transition hover:brightness-95">
                    Go to your dashboard <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                <a href="#course-catalog" className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 px-4 py-2.5 text-sm font-semibold transition hover:bg-primary-foreground/10">
                  Explore the catalog
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-primary-foreground/10 bg-primary-foreground/10 p-4 backdrop-blur-sm">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-energy text-energy-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Explore at your pace</p>
                <p className="mt-0.5 text-xs text-primary-foreground/70">
                  {loading ? "Browse published training courses" : `${courses.length} published courses across ${categories.length} disciplines`}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="course-catalog" className="scroll-mt-24 space-y-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Course search</p>
              <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">Training catalog</h2>
              <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
                {loading ? "Loading published courses…" : `Showing ${filteredCourses.length} of ${courses.length} published course${courses.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <button type="button" onClick={resetFilters} className="inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5">
              <FilterX className="h-4 w-4" /> Reset filters
            </button>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <label className="sr-only" htmlFor="course-search">Search courses</label>
              <input
                id="course-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search course name, code, discipline, or keyword…"
                className="h-12 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FilterSelect id="course-category" label="Discipline & category" value={category} onChange={setCategory}>
                <option value="all">All categories</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </FilterSelect>
              <FilterSelect id="course-tier" label="Certification level" value={tier} onChange={setTier}>
                <option value="all">All levels</option>
                {tiers.map((item) => <option key={item} value={item}>{item}</option>)}
              </FilterSelect>
              <FilterSelect id="course-enrollment" label="Enrollment option" value={enrollment} onChange={(value) => setEnrollment(value as CourseCatalogEnrollmentFilter)}>
                <option value="all">All enrollment options</option>
                <option value="individual">Individual enrollment</option>
                <option value="organization">Organization enrollment</option>
              </FilterSelect>
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading courses">
              {[0, 1, 2].map((item) => <div key={item} className="h-80 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : !error && filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold">No courses match your search</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Try another keyword or adjust your filters to see more training options.
              </p>
              <button type="button" onClick={resetFilters} className="mt-4 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Clear filters
              </button>
            </div>
          ) : !error && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  image={getCourseImage(course)}
                  canEnroll={canEnroll}
                  isEnrolled={enrolledCourseIds.has(course.id)}
                  isSignedIn={Boolean(user)}
                  isPortalRoute={isPortalRoute}
                />
              ))}
              <aside className="flex flex-col justify-between rounded-xl bg-muted p-6">
                <div>
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-energy text-energy-foreground">
                    <UsersRound className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold">Training for your team?</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Ask us about dedicated cohorts and organization training for your workforce.
                  </p>
                </div>
                <Link to="/contact" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                  Contact the training team <ArrowRight className="h-4 w-4" />
                </Link>
              </aside>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-bold">Ready to begin?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a trainee account to enroll in available courses and manage your training records.
              </p>
            </div>
          </div>
          {!user ? (
            <Link to="/register" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Sign up <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link to={dashboardLink} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Go to dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </section>
      </div>
    </main>
  );

  if (user && !isPortalRoute) {
    return <Navigate to={`/training/courses${location.search}`} replace />;
  }

  return isPortalRoute ? (
    <AdminPageShell withSidebar={Boolean(user)} searchPlaceholder="Search published courses…">
      {content}
    </AdminPageShell>
  ) : content;
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {children}
      </select>
    </div>
  );
}

function CourseCard({
  course,
  image,
  canEnroll,
  isEnrolled,
  isSignedIn,
  isPortalRoute,
}: {
  course: CourseRecord;
  image: string;
  canEnroll: boolean;
  isEnrolled: boolean;
  isSignedIn: boolean;
  isPortalRoute: boolean;
}) {
  const duration = formatDuration(course);
  const individuallyAvailable = course.individual_enrollment_enabled !== false;
  const description = course.short_description || course.description;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-card">
      <div className="relative h-48 overflow-hidden bg-muted">
        <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" aria-hidden="true" />
        {isEnrolled && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-900 shadow-sm">
            <CheckCircle2 className="h-4 w-4" /> Already enrolled
          </span>
        )}
        <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${individuallyAvailable ? "bg-secondary text-secondary-foreground" : "bg-background/90 text-foreground"}`}>
          <span className={`h-2 w-2 rounded-full ${individuallyAvailable ? "bg-primary" : "bg-muted-foreground"}`} />
          {individuallyAvailable ? "Individual enrollment" : "Organization enrollment"}
        </span>
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 text-white">
          <span className="truncate rounded bg-black/35 px-2 py-1 text-xs font-semibold backdrop-blur">{course.code || course.category}</span>
          {duration && <span className="inline-flex shrink-0 items-center gap-1 rounded bg-black/35 px-2 py-1 text-xs backdrop-blur"><Clock3 className="h-3.5 w-3.5" />{duration}</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-primary">{course.category}</span>
          {course.tier && <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"><BadgeCheck className="h-3.5 w-3.5 text-primary" />{course.tier}</span>}
        </div>
        <h3 className="mt-3 text-lg font-bold leading-snug">
          <Link
            to={`${isPortalRoute ? "/training/courses" : "/courses"}/${course.id}`}
            className="transition hover:text-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {course.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 min-h-[3.75rem] text-sm text-muted-foreground">
          {description || "Contact our training team for course details and prerequisites."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {course.delivery_mode && <span className="rounded-md bg-muted px-2 py-1">{course.delivery_mode}</span>}
          {course.certificate_enabled && <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />Certificate included</span>}
        </div>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-border/70 pt-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Course fee</p>
            <p className="mt-0.5 text-lg font-bold">{formatPrice(course)}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              to={`${isPortalRoute ? "/training/courses" : "/courses"}/${course.id}`}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Details
            </Link>
            {canEnroll && isEnrolled ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-700/15 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-800" role="status">
                <CheckCircle2 className="h-4 w-4" /> Already enrolled
              </span>
            ) : canEnroll && individuallyAvailable ? (
              <Link
                to={`${isPortalRoute ? "/training/courses" : "/courses"}/${course.id}?enroll=1`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Enroll <ArrowRight className="h-4 w-4" />
              </Link>
            ) : !individuallyAvailable || isSignedIn ? (
              <Link to="/contact" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-muted px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/70">
                Contact <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link to="/register" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90">
                Sign up <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
