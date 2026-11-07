import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link, Navigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  GraduationCap,
  Landmark,
  MapPin,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import {
  fetchPublicCourseById,
  type CourseModule,
  type CourseRecord,
} from "@/lib/courses";
import courseRigImage from "@/assets/course-rig.jpg";
import courseSubseaImage from "@/assets/course-subsea.jpg";
import courseHazmatImage from "@/assets/course-hazmat.jpg";

type PublicCourse = CourseRecord & {
  prerequisite_required?: boolean;
  prerequisite_type?: "internal" | "external" | null;
  prerequisite_course_id?: number | null;
  prerequisite_description?: string;
  certificate_external?: boolean;
  certificate_authority?: string | null;
  certificate_license_id?: string | null;
  certificate_portal_url?: string | null;
};

function getCourseImage(course: CourseRecord) {
  if (course.thumbnail_url || course.image) return course.thumbnail_url || course.image || "";
  const category = course.category?.toLowerCase() || "";
  if (category.includes("safety") || category.includes("hse")) return courseHazmatImage;
  if (category.includes("technical") || category.includes("engineering")) return courseRigImage;
  return courseSubseaImage;
}

function formatPrice(course: CourseRecord) {
  const price = Number(course.price);
  if (!Number.isFinite(price) || price <= 0) return "Contact for pricing";
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

function formatDuration(course: CourseRecord) {
  if (!course.duration_value) return "Not specified";
  return `${course.duration_value} ${(course.duration_unit || "hours").toLowerCase()}`;
}

export default function CourseDetails() {
  const { courseId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth() as { user: { role?: string } | null };
  const shouldReduceMotion = useReducedMotion();
  const isPortalRoute = location.pathname.startsWith("/training/");
  const role = (user?.role || "").toUpperCase();
  const canEnroll = role === "TRAINEE" || role === "STUDENT";
  const feeSectionRef = useRef<HTMLElement>(null);

  const [course, setCourse] = useState<PublicCourse | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentExpanded, setPaymentExpanded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "transfer" | null>(null);
  const [paymentNotice, setPaymentNotice] = useState(false);

  useEffect(() => {
    if (searchParams.get("enroll") !== "1") return;
    setPaymentExpanded(true);
    if (loading) return;
    window.requestAnimationFrame(() => {
      feeSectionRef.current?.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "center" });
    });
  }, [courseId, loading, searchParams, shouldReduceMotion]);

  useEffect(() => {
    let active = true;
    const id = Number(courseId);

    if (!Number.isInteger(id) || id <= 0) {
      setError("This course link is invalid.");
      setLoading(false);
      setCourse(null);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError("");
    setCourse(null);
    fetchPublicCourseById(id)
      .then((result) => {
        if (!active) return;
        setCourse(result.course as PublicCourse);
        setModules(result.modules || []);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Could not load this course.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [courseId]);

  const courseListPath = isPortalRoute ? "/training/courses" : "/courses";
  const mainContent = (
    <main className={isPortalRoute ? "page-padding" : "min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8 lg:py-12"}>
      <div className="mx-auto max-w-[1280px]">
        <Link to={courseListPath} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to course catalog
        </Link>

        {loading ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              <div className="h-72 animate-pulse rounded-2xl bg-muted" />
              <div className="h-56 animate-pulse rounded-xl bg-muted" />
            </div>
            <div className="h-96 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : error || !course ? (
          <section className="mt-6 rounded-xl border border-border bg-card p-8 text-center" role="alert">
            <h1 className="text-xl font-bold">Course unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error || "This course may no longer be published."}</p>
            <Link to={courseListPath} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Return to catalog <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        ) : (
          <>
            <header className="py-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">{course.category}</span>
                {course.tier && <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{course.tier}</span>}
                {course.code && <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">Code: {course.code}</span>}
              </div>
              <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-tight sm:text-4xl">{course.title}</h1>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">
                {course.short_description || course.description || "Contact the Gokly training team for details about this course."}
              </p>
            </header>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0 space-y-6">
                <div className="relative h-56 overflow-hidden rounded-xl bg-muted shadow-sm sm:h-72">
                  <img src={getCourseImage(course)} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" aria-hidden="true" />
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">Course overview</p>
                    <p className="mt-1 text-lg font-semibold sm:text-xl">{course.title}</p>
                  </div>
                </div>

                <section className="space-y-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
                  <SectionHeading icon={BookOpen} eyebrow="Course information" title="Overview & technical scope" />
                  <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                    {course.description || course.short_description || "Course overview will be provided by the training team."}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Fact label="Duration" value={formatDuration(course)} />
                    <Fact label="Level" value={course.tier || "Not specified"} />
                    <Fact label="Delivery" value={course.delivery_mode || "To be confirmed"} />
                  </div>
                </section>

                <section className="space-y-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
                  <SectionHeading icon={GraduationCap} eyebrow="Course curriculum" title="Modules & learning content" />
                  {modules.length > 0 ? (
                    <ol className="space-y-3">
                      {modules.map((module, index) => (
                        <li key={module.name + index} className="flex gap-3 rounded-lg bg-muted/50 p-4">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-semibold">{module.name}</h3>
                            {module.description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{module.description}</p>}
                            {module.has_assessment && (
                              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Assessment included
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                      Detailed module information has not been published for this course yet. Contact the training team for the syllabus.
                    </p>
                  )}
                </section>

                <section className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
                    <SectionHeading icon={ShieldCheck} eyebrow="Before you enroll" title="Prerequisites" />
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {course.prerequisite_required
                        ? course.prerequisite_description || (course.prerequisite_type === "internal" ? "Completion of the required prerequisite course is needed." : "A prerequisite qualification is required. Contact the training team to confirm accepted credentials.")
                        : "No prerequisite requirement is listed for this course. Contact the training team if you need help checking eligibility."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
                    <SectionHeading icon={BadgeCheck} eyebrow="Recognition" title="Certificate information" />
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {course.certificate_enabled
                        ? course.certificate_external && course.certificate_authority
                          ? `Certificate issuance is managed by ${course.certificate_authority}.`
                          : "A course certificate is configured for eligible learners who complete the course requirements."
                        : "A certificate is not listed for this course."}
                    </p>
                    {course.certificate_external && course.certificate_license_id && (
                      <p className="mt-2 text-xs text-muted-foreground">Authority reference: {course.certificate_license_id}</p>
                    )}
                    {course.certificate_external && course.certificate_portal_url && (
                      <a href={course.certificate_portal_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                        Visit certificate authority <ArrowRight className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </section>

                <section className="flex flex-col gap-4 rounded-xl bg-muted/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex items-start gap-3">
                    <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <h2 className="font-bold">Need a team or custom cohort?</h2>
                      <p className="mt-1 text-sm text-muted-foreground">Contact us to discuss organizational enrollment and delivery options.</p>
                    </div>
                  </div>
                  <Link to="/contact" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-primary hover:underline">
                    Contact training team <ArrowRight className="h-4 w-4" />
                  </Link>
                </section>
              </div>

              <aside className="space-y-5 lg:sticky lg:top-24">
                <section ref={feeSectionRef} className="space-y-5 rounded-xl border border-border/70 bg-card p-5 shadow-card sm:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Course fee</p>
                    <p className="mt-1 text-3xl font-extrabold text-primary">{formatPrice(course)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Final fees and any applicable charges are confirmed during registration.</p>
                  </div>

                  {canEnroll && course.individual_enrollment_enabled !== false ? (
                    <button
                      type="button"
                      aria-expanded={paymentExpanded}
                      aria-controls="course-payment-options"
                      onClick={() => {
                        setPaymentExpanded((expanded) => !expanded);
                        setPaymentNotice(false);
                      }}
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {paymentExpanded ? "Close enrollment options" : "Enroll in this course"}
                      {paymentExpanded ? <X className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                    </button>
                  ) : !user ? (
                    <Link to="/register" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                      Create account to enroll <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link to="/contact" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                      Ask about enrollment <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}

                  <AnimatePresence initial={false}>
                    {paymentExpanded && canEnroll && course.individual_enrollment_enabled !== false && (
                      <motion.div
                        id="course-payment-options"
                        key="course-payment-options"
                        initial={shouldReduceMotion ? false : { opacity: 0, height: 0, y: -8 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, height: 0, y: -6 }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] via-card to-card p-4 shadow-inner sm:p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Your payment summary</p>
                              <p className="mt-1 text-sm font-semibold text-foreground">{course.title}</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary">
                              {formatPrice(course)}
                            </span>
                          </div>

                          <div className="my-4 space-y-2 border-y border-border/70 py-3 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground">Course fee</span>
                              <span className="font-semibold">{formatPrice(course)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground">Additional charges</span>
                              <span className="text-xs font-medium text-muted-foreground">Confirmed during registration</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 pt-1">
                              <span className="font-bold">Estimated total</span>
                              <span className="text-base font-extrabold text-primary">{formatPrice(course)}</span>
                            </div>
                          </div>

                          <fieldset>
                            <legend className="text-sm font-bold">Choose a payment method</legend>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">Select how you’d prefer to pay. We’ll confirm the secure payment instructions with you.</p>
                            <div className="mt-3 grid gap-2">
                              <PaymentMethodOption
                                id="payment-card"
                                title="Card or USSD"
                                description="Secure online checkout"
                                icon={CreditCard}
                                selected={paymentMethod === "card"}
                                onChange={() => {
                                  setPaymentMethod("card");
                                  setPaymentNotice(false);
                                }}
                              />
                              <PaymentMethodOption
                                id="payment-transfer"
                                title="Bank transfer"
                                description="Receive verified transfer details"
                                icon={Landmark}
                                selected={paymentMethod === "transfer"}
                                onChange={() => {
                                  setPaymentMethod("transfer");
                                  setPaymentNotice(false);
                                }}
                              />
                            </div>
                          </fieldset>

                          {paymentNotice ? (
                            <div className="mt-4 rounded-lg border border-amber-300/70 bg-amber-50 p-3 text-xs leading-5 text-amber-950" role="status">
                              <p className="font-bold">Online payment setup is not available yet.</p>
                              <p className="mt-1">No payment has been taken. Please contact the training team to confirm the final amount and arrange your selected method.</p>
                              <Link to="/contact" className="mt-2 inline-flex items-center gap-1 font-bold text-primary hover:underline">
                                Contact the training team <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={!paymentMethod}
                              onClick={() => setPaymentNotice(true)}
                              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {paymentMethod ? "Continue with selected method" : "Select a payment method"}
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          )}
                          <p className="mt-3 text-center text-[11px] leading-4 text-muted-foreground">
                            No payment is taken on this page.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <dl className="divide-y divide-border/70 border-t border-border/70">
                    <QuickFact icon={Clock3} label="Duration" value={formatDuration(course)} />
                    <QuickFact icon={GraduationCap} label="Level" value={course.tier || "Not specified"} />
                    <QuickFact icon={MapPin} label="Delivery mode" value={course.delivery_mode || "To be confirmed"} />
                    <QuickFact icon={BadgeCheck} label="Certificate" value={course.certificate_enabled ? "Available on completion" : "Not listed"} />
                  </dl>

                  <Link to={courseListPath} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted">
                    Browse other courses <ArrowRight className="h-4 w-4" />
                  </Link>
                </section>
                <section className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
                  <h2 className="font-bold">Have questions?</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Our team can help with upcoming dates, prerequisites, and course suitability.</p>
                  <Link to="/contact" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                    Contact us <ArrowRight className="h-4 w-4" />
                  </Link>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  );

  if (user && !isPortalRoute) {
    const query = searchParams.toString();
    return <Navigate to={`/training/courses/${courseId}${query ? `?${query}` : ""}`} replace />;
  }

  return isPortalRoute ? (
    <AdminPageShell withSidebar={Boolean(user)} searchPlaceholder="Search published courses…">
      {mainContent}
    </AdminPageShell>
  ) : mainContent;
}

function PaymentMethodOption({
  id,
  title,
  description,
  icon: Icon,
  selected,
  onChange,
}: {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  selected: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`relative flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition focus-within:outline-none focus-within:ring-2 focus-within:ring-primary ${
        selected
          ? "border-primary bg-primary/[0.07] shadow-sm"
          : "border-border bg-background/80 hover:border-primary/40 hover:bg-background"
      }`}
    >
      <input
        id={id}
        type="radio"
        name="course-payment-method"
        checked={selected}
        onChange={onChange}
        className="sr-only"
      />
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
        {selected && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
      </span>
    </label>
  );
}

function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</p>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function QuickFact({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 text-sm">
      <dt className="inline-flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> {label}
      </dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
