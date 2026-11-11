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
  Copy,
  GraduationCap,
  Landmark,
  MapPin,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import {
  enrollInCourse,
  fetchMyEnrolledCourseIds,
  fetchPublicCourseById,
  initializeCoursePayment,
  type CoursePaymentMethod,
  type CourseModule,
  type CourseRecord,
  verifyCoursePayment,
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

function formatDuration(course: CourseRecord) {
  if (!course.duration_value) return "Not specified";
  return `${course.duration_value} ${(course.duration_unit || "hours").toLowerCase()}`;
}

function formatNairaKobo(amountKobo: number) {
  const naira = Math.floor(amountKobo / 100);
  const kobo = String(amountKobo % 100).padStart(2, "0");
  return `₦${new Intl.NumberFormat("en-NG").format(naira)}.${kobo}`;
}

function CourseEnrollmentSuccess({
  course,
  amountKobo,
  paymentMethod,
  paymentReference,
  courseListPath,
  shouldReduceMotion,
}: {
  course: CourseRecord;
  amountKobo: number | null;
  paymentMethod: CoursePaymentMethod | null;
  paymentReference: string | null;
  courseListPath: string;
  shouldReduceMotion: boolean | null;
}) {
  const copyReference = async () => {
    if (!paymentReference) return;
    try {
      await navigator.clipboard.writeText(paymentReference);
      toast.success("Payment reference copied.");
    } catch {
      toast.error("Couldn’t copy the payment reference.", {
        description: "You can select and copy the reference manually.",
      });
    }
  };

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-6xl py-6 sm:py-10"
    >
      <div className="relative isolate overflow-hidden rounded-3xl border border-primary/10 bg-card p-6 shadow-xl shadow-primary/[0.06] sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-20 -top-24 -z-10 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 -z-10 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
                <ShieldCheck className="h-4 w-4" />
                {amountKobo === null ? "Enrollment confirmed" : "Payment verified"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Course access is active
              </span>
            </div>
            <h1 className="mt-5 max-w-3xl text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {amountKobo === null ? "You’re officially enrolled." : "Payment successful. Your seat is confirmed."}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {amountKobo === null
                ? `You’re enrolled in ${course.title}. You can find your course in the training dashboard.`
                : `Your payment for ${course.title} has been verified securely. Your enrollment is active and ready in the training dashboard.`}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/training/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 hover:bg-primary/90"
              >
                Go to my training <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={courseListPath}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-bold transition hover:bg-muted"
              >
                Browse more courses
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[280px] rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70 p-6 text-center shadow-inner">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-700 ring-8 ring-white/80 shadow-sm">
              <CheckCircle2 className="h-11 w-11" strokeWidth={2.2} />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">
              {amountKobo === null ? "Enrollment status" : "Amount confirmed"}
            </p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              {amountKobo === null ? "Active" : formatNairaKobo(amountKobo)}
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="h-4 w-4" />
              Verified by Gokly
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-7" aria-labelledby="enrollment-summary-title">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-5">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Your enrollment</p>
                <h2 id="enrollment-summary-title" className="mt-1 text-xl font-bold tracking-tight">Course summary</h2>
              </div>
            </div>
            {course.code && (
              <span className="rounded-lg bg-muted px-3 py-2 text-xs font-bold text-muted-foreground">
                Course {course.code}
              </span>
            )}
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-border/70 bg-muted/30 sm:flex">
            <img src={getCourseImage(course)} alt="" className="h-44 w-full object-cover sm:h-auto sm:w-56" />
            <div className="min-w-0 flex-1 p-4 sm:p-5">
              <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                {course.category}
              </span>
              <h3 className="mt-3 text-lg font-bold leading-snug">{course.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                {course.short_description || course.description || "Your course details and learning materials are available from your training dashboard."}
              </p>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <Fact label="Duration" value={formatDuration(course)} />
            <Fact label="Learning level" value={course.tier || "Not specified"} />
            <Fact label="Delivery mode" value={course.delivery_mode || "To be confirmed"} />
            <Fact label="Enrollment" value="Active" />
          </dl>

          {amountKobo !== null && (
            <div className="mt-5 rounded-xl border border-border/70 bg-background p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Payment record</p>
                  <p className="mt-1 text-sm font-semibold">Course fee paid</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-extrabold text-emerald-800">
                  {formatNairaKobo(amountKobo)} NGN
                </span>
              </div>
              <div className="mt-4 grid gap-3 border-t border-border/70 pt-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Payment method</p>
                  <p className="mt-1 text-sm font-bold">
                    {paymentMethod === "BANK_TRANSFER" ? "Bank transfer" : paymentMethod === "CARD" ? "Card or USSD" : "Paystack"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Payment status</p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Successful
                  </p>
                </div>
              </div>
              {paymentReference && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">Payment reference</p>
                    <p className="mt-1 break-all font-mono text-xs font-bold text-foreground">{paymentReference}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyReference()}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold transition hover:bg-muted"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy reference
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-6">
          <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6" aria-labelledby="next-steps-title">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">You’re all set</p>
            <h2 id="next-steps-title" className="mt-1 text-xl font-bold tracking-tight">What happens next?</h2>
            <ol className="mt-5 space-y-5">
              <li className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground">1</span>
                <div>
                  <p className="text-sm font-bold">Open your training dashboard</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Your active course is ready in your training area.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-extrabold text-primary">2</span>
                <div>
                  <p className="text-sm font-bold">Review the course information</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Check the learning details and course materials before you begin.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-extrabold text-primary">3</span>
                <div>
                  <p className="text-sm font-bold">Keep your payment reference</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Use it if you need help with this payment or enrollment.</p>
                </div>
              </li>
            </ol>
          </section>
          <section className="rounded-2xl border border-primary/10 bg-primary/[0.04] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-bold">Need a hand?</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Our team can help with your enrollment or payment confirmation.
                </p>
                <Link to="/contact" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                  Contact the training team <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </motion.section>
  );
}

export default function CourseDetails() {
  const { courseId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth() as { user: { id?: number; role?: string } | null };
  const shouldReduceMotion = useReducedMotion();
  const isPortalRoute = location.pathname.startsWith("/training/");
  const role = (user?.role || "").toUpperCase();
  const canEnroll = role === "TRAINEE" || role === "STUDENT";
  const feeSectionRef = useRef<HTMLElement>(null);

  const [course, setCourse] = useState<PublicCourse | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [enrollmentCheck, setEnrollmentCheck] = useState<"checking" | "available" | "enrolled" | "error">(
    canEnroll ? "checking" : "available",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentExpanded, setPaymentExpanded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<CoursePaymentMethod | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentResult, setPaymentResult] = useState<"verifying" | "success" | "failed" | null>(null);
  const [verifiedPayment, setVerifiedPayment] = useState<{ amountKobo: number; method: CoursePaymentMethod } | null>(null);
  const [freeEnrollmentLoading, setFreeEnrollmentLoading] = useState(false);
  const paymentReference = searchParams.get("reference") || searchParams.get("trxref") || "";
  const isPaymentCallback = searchParams.get("payment") === "paystack";
  const numericPrice = Number(course?.price);
  const isFreeCourse = Number.isFinite(numericPrice) && numericPrice === 0;
  const isNgnCourse = course?.currency?.toUpperCase() === "NGN";

  useEffect(() => {
    if (searchParams.get("enroll") !== "1") return;
    setPaymentExpanded(true);
    if (loading) return;
    window.requestAnimationFrame(() => {
      feeSectionRef.current?.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "center" });
    });
  }, [courseId, loading, searchParams, shouldReduceMotion]);

  useEffect(() => {
    if (paymentResult !== "success") return;
    window.scrollTo({ top: 0, behavior: shouldReduceMotion ? "auto" : "smooth" });
  }, [paymentResult, shouldReduceMotion]);

  useEffect(() => {
    if (!isPaymentCallback) return;
    setPaymentExpanded(true);
    if (!paymentReference) {
      setPaymentResult("failed");
      setPaymentError("We couldn’t find the payment reference. Please contact the training team before trying again.");
      return;
    }

    let active = true;
    setPaymentResult("verifying");
    setPaymentError("");
    verifyCoursePayment(paymentReference)
      .then((result) => {
        if (!active) return;
        if (result.enrolled && result.status === "success") {
          setVerifiedPayment({ amountKobo: result.amount_kobo, method: result.payment_method });
          setPaymentResult("success");
        } else {
          setPaymentResult("failed");
          setPaymentError(
            result.status === "pending"
              ? "Your payment is still processing. Refresh this page in a moment to check again."
              : "We couldn’t confirm this payment. No course enrollment has been granted. Please retry checkout or contact the training team.",
          );
        }
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setPaymentResult("failed");
        setPaymentError(cause instanceof Error ? cause.message : "Could not verify your payment.");
      });

    return () => {
      active = false;
    };
  }, [isPaymentCallback, paymentReference]);

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
    setEnrollmentCheck(canEnroll ? "checking" : "available");
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
    if (canEnroll) {
      fetchMyEnrolledCourseIds()
        .then((enrolledCourseIds) => {
          if (active) setEnrollmentCheck(enrolledCourseIds.includes(id) ? "enrolled" : "available");
        })
        .catch(() => {
          if (active) setEnrollmentCheck("error");
        });
    }

    return () => {
      active = false;
    };
  }, [canEnroll, courseId, user?.id]);

  const courseListPath = isPortalRoute ? "/training/courses" : "/courses";
  const startCheckout = async () => {
    if (!course || !paymentMethod) return;
    setPaymentLoading(true);
    setPaymentError("");
    try {
      const { authorization_url } = await initializeCoursePayment(course.id, paymentMethod);
      const checkoutUrl = new URL(authorization_url);
      if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.paystack.com") {
        throw new Error("Paystack returned an invalid checkout address.");
      }
      window.location.assign(checkoutUrl.toString());
    } catch (cause) {
      setPaymentError(cause instanceof Error ? cause.message : "Could not start secure checkout.");
      setPaymentLoading(false);
    }
  };
  const enrollFreeCourse = async () => {
    if (!course) return;
    setFreeEnrollmentLoading(true);
    setPaymentError("");
    try {
      await enrollInCourse(course.id);
      setVerifiedPayment(null);
      setPaymentResult("success");
    } catch (cause) {
      setPaymentError(cause instanceof Error ? cause.message : "Could not enroll in this course.");
    } finally {
      setFreeEnrollmentLoading(false);
    }
  };

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
        ) : paymentResult === "success" ? (
          <CourseEnrollmentSuccess
            course={course}
            amountKobo={verifiedPayment?.amountKobo ?? null}
            paymentMethod={verifiedPayment?.method ?? null}
            paymentReference={paymentReference || null}
            courseListPath={courseListPath}
            shouldReduceMotion={shouldReduceMotion}
          />
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

                  {canEnroll && enrollmentCheck === "enrolled" ? (
                    <div className="rounded-xl border border-emerald-700/15 bg-emerald-50 p-4 text-emerald-950" role="status">
                      <p className="flex items-center gap-2 text-sm font-bold">
                        <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                        Already enrolled in this course
                      </p>
                      <p className="mt-1 text-xs leading-5 text-emerald-900/80">
                        You already have access. Open your training dashboard to continue learning.
                      </p>
                      <Link to="/training/dashboard" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-800 hover:underline">
                        Go to my training <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ) : canEnroll && enrollmentCheck === "checking" ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs font-medium text-muted-foreground" role="status">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" aria-hidden="true" />
                      Checking your enrollment…
                    </div>
                  ) : canEnroll && enrollmentCheck === "error" ? (
                    <div className="rounded-lg border border-amber-300/70 bg-amber-50 p-3 text-xs leading-5 text-amber-950" role="alert">
                      We couldn’t check your enrollment status, so enrollment is temporarily unavailable. Please refresh or contact the training team.
                    </div>
                  ) : canEnroll && course.individual_enrollment_enabled !== false ? (
                    <button
                      type="button"
                      aria-expanded={paymentExpanded}
                      aria-controls="course-payment-options"
                      onClick={() => {
                        setPaymentExpanded((expanded) => !expanded);
                        setPaymentError("");
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
                    {paymentExpanded && canEnroll && enrollmentCheck === "available" && course.individual_enrollment_enabled !== false && (
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

                          {paymentResult === "verifying" && (
                            <div className="mt-4 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm" role="status">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" aria-hidden="true" />
                              <span className="font-medium">Verifying payment securely with Paystack…</span>
                            </div>
                          )}
                          {paymentError && paymentResult !== "verifying" && (
                            <div className="mt-4 rounded-lg border border-amber-300/70 bg-amber-50 p-3 text-xs leading-5 text-amber-950" role="alert">
                              {paymentError}
                            </div>
                          )}

                          {isFreeCourse ? (
                            <button
                              type="button"
                              disabled={freeEnrollmentLoading}
                              onClick={() => void enrollFreeCourse()}
                              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {freeEnrollmentLoading ? "Enrolling…" : "Enroll in free course"}
                              {!freeEnrollmentLoading && <ArrowRight className="h-4 w-4" />}
                            </button>
                          ) : !isNgnCourse ? (
                            <div className="mt-4 rounded-lg border border-amber-300/70 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
                              Paystack checkout is currently enabled for NGN course pricing only. Contact the training team for this course.
                            </div>
                          ) : (
                            <>
                              <fieldset>
                                <legend className="text-sm font-bold">Choose a payment method</legend>
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">You’ll complete payment on Paystack’s secure checkout page.</p>
                                <div className="mt-3 grid gap-2">
                                  <PaymentMethodOption
                                    id="payment-card"
                                    name="course-payment-method"
                                    title="Card or USSD"
                                    description="Pay securely with a card or USSD"
                                    icon={CreditCard}
                                    selected={paymentMethod === "CARD"}
                                    onChange={() => {
                                      setPaymentMethod("CARD");
                                      setPaymentError("");
                                    }}
                                  />
                                  <PaymentMethodOption
                                    id="payment-transfer"
                                    name="course-payment-method"
                                    title="Bank transfer"
                                    description="Pay by bank transfer through Paystack"
                                    icon={Landmark}
                                    selected={paymentMethod === "BANK_TRANSFER"}
                                    onChange={() => {
                                      setPaymentMethod("BANK_TRANSFER");
                                      setPaymentError("");
                                    }}
                                  />
                                </div>
                              </fieldset>
                              <button
                                type="button"
                                disabled={!paymentMethod || paymentLoading || paymentResult === "verifying"}
                                onClick={() => void startCheckout()}
                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {paymentLoading ? "Connecting to Paystack…" : "Continue securely with Paystack"}
                                {!paymentLoading && <ArrowRight className="h-4 w-4" />}
                              </button>
                              <p className="mt-3 text-center text-[11px] leading-4 text-muted-foreground">
                                Your card details are entered on Paystack; Gokly does not store them.
                              </p>
                            </>
                          )}
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
  name,
  title,
  description,
  icon: Icon,
  selected,
  onChange,
}: {
  id: string;
  name: string;
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
        name={name}
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
