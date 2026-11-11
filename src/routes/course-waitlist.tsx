import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BellRing,
  Calendar as CalendarIcon,
  CalendarClock,
  CheckCircle2,
  Copy,
  Info,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { toast } from "sonner";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";
import {
  fetchCourseWaitlistEntry,
  fetchPublicCourseById,
  joinCourseWaitlist,
  type CourseRecord,
  type CourseWaitlistEntry,
} from "@/lib/courses";

function DatePickerField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const parsedDate = value ? parseISO(value) : undefined;
  const selectedDate = parsedDate && isValid(parsedDate) ? parsedDate : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-label={label}
          aria-haspopup="dialog"
          className="h-auto w-full justify-start rounded-lg border border-border bg-background px-3 py-2.5 pl-9 text-left text-sm font-normal text-foreground shadow-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          {selectedDate ? format(selectedDate, "PPP") : <span className="text-muted-foreground/70">Select a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
          initialFocus
        />
        {value && (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 pl-9 text-sm text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

function displayName(user: { first_name?: string; last_name?: string; name?: string; email?: string } | null) {
  if (!user) return "";
  const full = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return full || user.name || user.email?.split("@")[0] || "";
}

export default function CourseWaitlist() {
  const { courseId } = useParams();
  const location = useLocation();
  const { user } = useAuth() as {
    user: {
      id?: number;
      first_name?: string;
      last_name?: string;
      name?: string;
      email?: string;
      phone?: string;
      role?: string;
    } | null;
  };
  const isPortalRoute = location.pathname.startsWith("/training/");
  const shouldReduceMotion = useReducedMotion();
  const courseListPath = isPortalRoute ? "/training/courses" : "/courses";
  const detailsPath = `${courseListPath}/${courseId}`;
  const numericId = Number(courseId);

  const [course, setCourse] = useState<CourseRecord | null>(null);
  const [existingEntry, setExistingEntry] = useState<CourseWaitlistEntry | null>(null);
  const [entryChecked, setEntryChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedEntry, setSubmittedEntry] = useState<CourseWaitlistEntry | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");

  const isSignedIn = Boolean(user);

  useEffect(() => {
    let active = true;
    const id = Number(courseId);
    if (!Number.isInteger(id) || id <= 0) {
      setError("This course link is invalid.");
      setLoading(false);
      return () => {
        active = false;
      };
    }
    setLoading(true);
    fetchPublicCourseById(id)
      .then((result) => {
        if (active) setCourse(result.course as CourseRecord);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load this course.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [courseId]);

  useEffect(() => {
    if (!isSignedIn || !Number.isInteger(numericId) || numericId <= 0) return;
    let active = true;
    fetchCourseWaitlistEntry(numericId)
      .then((entry) => {
        if (!active) return;
        setExistingEntry(entry);
        setEntryChecked(true);
      })
      .catch(() => {
        if (active) setEntryChecked(true);
      });
    return () => {
      active = false;
    };
  }, [isSignedIn, numericId, user?.id]);

  useEffect(() => {
    if (!user) return;
    setFullName((current) => current || displayName(user));
    setEmail((current) => current || user.email || "");
    setPhone((current) => current || (user as { phone?: string }).phone || "");
  }, [user]);

  const activeEntry = submittedEntry || existingEntry;

  const copyTicket = async () => {
    if (!activeEntry) return;
    try {
      await navigator.clipboard.writeText(activeEntry.ticket_number);
      toast.success("Ticket number copied.");
    } catch {
      toast.error("Couldn’t copy the ticket number.");
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!course || submitting) return;
    setSubmitting(true);
    try {
      const result = await joinCourseWaitlist(course.id, {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        timeframe: targetDate || null,
        notes: notes.trim() || null,
      });
      setSubmittedEntry(result.entry);
      setExistingEntry(result.entry);
      toast.success(result.already_waitlisted ? "You are already on the waitlist." : "Interest logged — you're on the waitlist.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not submit your interest.");
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <main className={isPortalRoute ? "page-padding" : "min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8 lg:py-12"}>
      <div className="mx-auto max-w-2xl">
        <Link
          to={detailsPath}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to course details
        </Link>

        {loading ? (
          <div className="mt-6 space-y-4">
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
            <div className="h-40 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : error || !course ? (
          <section className="mt-6 rounded-xl border border-border bg-card p-8 text-center" role="alert">
            <h1 className="text-xl font-bold">Course unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error || "This course may no longer be published."}</p>
            <Link
              to={courseListPath}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Return to catalog <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        ) : !isSignedIn ? (
          <section className="mt-6 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <BellRing className="h-6 w-6" />
            </span>
            <h1 className="mt-4 text-xl font-bold">Sign in to join the waitlist</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Create a free trainee account or sign in to register your interest in {course.title}. You’ll be notified as soon as a cohort opens.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Create account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-muted"
              >
                Sign in
              </Link>
            </div>
          </section>
        ) : activeEntry ? (
          <motion.section
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 rounded-2xl border border-emerald-700/15 bg-card p-6 shadow-sm sm:p-8"
          >
            <div className="flex items-start gap-4">
              <motion.span
                initial={shouldReduceMotion ? false : { scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: shouldReduceMotion ? 0 : 0.15 }}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"
              >
                <CheckCircle2 className="h-6 w-6" />
              </motion.span>
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: shouldReduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="min-w-0"
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Priority notification list</p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight">You're on the waitlist</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  We've registered your interest in <span className="font-semibold text-foreground">{course.title}</span>.
                  As soon as a new cohort opens, you'll get an email with a reserved enrollment link.
                </p>
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.35, delay: shouldReduceMotion ? 0 : 0.4 }}
                  className="mt-5 flex flex-wrap items-center gap-3"
                >
                  <span className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 font-mono text-sm font-bold text-foreground">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    {activeEntry.ticket_number}
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyTicket()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy ticket
                  </button>
                  <span className="text-xs text-muted-foreground">
                    Registered {new Date(activeEntry.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </motion.div>
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.35, delay: shouldReduceMotion ? 0 : 0.5 }}
                  className="mt-6 flex flex-wrap gap-3"
                >
                  <Link
                    to={detailsPath}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                  >
                    Back to course details <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to={courseListPath}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
                  >
                    Browse more courses
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </motion.section>
        ) : (
          <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                <BellRing className="h-3.5 w-3.5" /> Expression of interest
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Interested in {course.title}?
              </h1>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                {course.enrollment_batch
                  ? `Registration for ${course.enrollment_batch.name} ${
                      course.enrollment_batch.registration_status === "upcoming"
                        ? "hasn't opened yet"
                        : "has closed"
                    }. Leave your details below and we'll notify you as soon as the next cohort opens.`
                  : "There is currently no upcoming cohort scheduled for this course. Leave your contact details below and our training coordinator will notify you as soon as one opens."}
              </p>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-border/70 bg-muted/40 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Info className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Zero commitment</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Joining the waitlist does <span className="font-semibold text-foreground">not</span> create a binding
                  registration, reserve a seat, or require payment. It only logs your interest so you get
                  priority alerts when a cohort opens.
                </p>
              </div>
            </div>

            <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Your details</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-semibold">Full name</span>
                    <span className="relative block">
                      <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        required
                        maxLength={120}
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className={inputClass}
                        placeholder="e.g. Chidubem Okafor"
                      />
                    </span>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold">Work email</span>
                    <span className="relative block">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        required
                        type="email"
                        maxLength={200}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className={inputClass}
                        placeholder="you@company.com"
                      />
                    </span>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold">Mobile phone</span>
                    <span className="relative block">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="tel"
                        maxLength={40}
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        className={inputClass}
                        placeholder="+234 ..."
                      />
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" /> Target date
                    <span className="text-xs font-normal text-muted-foreground">Optional</span>
                  </span>
                  <DatePickerField
                    id="waitlist-target-date"
                    label="Target training date"
                    value={targetDate}
                    onChange={setTargetDate}
                  />
                </div>
                <label className="block">
                  <span className="mb-1.5 flex items-center justify-between text-sm font-semibold">
                    Notes
                    <span className="text-xs font-normal text-muted-foreground">Optional</span>
                  </span>
                  <textarea
                    rows={2}
                    maxLength={1000}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Cohort size, OPITO matrix requirements, preferred location…"
                  />
                </label>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                You'll receive a confirmation with your priority ticket via email.
              </div>

              <div className="space-y-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting || !entryChecked}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Logging your interest…
                    </>
                  ) : (
                    <>
                      <BellRing className="h-4 w-4" /> Notify me when scheduled
                    </>
                  )}
                </button>
                <div className="text-center">
                  <Link
                    to={detailsPath}
                    className="inline-flex items-center gap-1 py-1 text-sm font-semibold text-muted-foreground transition hover:text-primary"
                  >
                    Cancel and return to course details <ArrowLeft className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </form>
          </section>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> NUPRC / NCDMB regulated center</span>
          <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-primary" /> No spam guarantee</span>
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Privacy compliant</span>
        </div>
      </div>
    </main>
  );

  // Keep authenticated users on the portal layout; bounce public-route users
  // with a session into the portal variant like course-details does.
  if (user && !isPortalRoute) {
    return <Navigate to={`/training/courses/${courseId}/waitlist${location.search}`} replace />;
  }

  return isPortalRoute ? (
    <AdminPageShell withSidebar={Boolean(user)} searchPlaceholder="Search published courses…">
      {content}
    </AdminPageShell>
  ) : (
    content
  );
}
