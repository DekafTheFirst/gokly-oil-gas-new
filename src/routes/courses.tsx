import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, Plus, BarChart3, ArrowRight, BadgeCheck, AlertCircle } from "lucide-react";
import { PageShell } from "@/components/educert/PageShell";
import { useAuth } from "@/context/AuthContext";

interface Course {
  id: number;
  title: string;
  category: string;
  description: string;
  tier: string;
  hours: string;
  image?: string;
  created_at: string;
}

const categories = ["All Modules", "HSE & Safety", "Offshore Ops", "Technical Tools", "Environmental"];
const tiers = ["Basic (T3)", "Advanced (T2)", "Expert (T1)"];

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch("/api/courses", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) throw new Error("Failed to fetch courses");
        const data = await response.json();
        setCourses(data.courses || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleEnroll = async (courseId: number) => {
    try {
      setEnrollingCourseId(courseId);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to enroll in course");
      setSuccessMessage("Successfully enrolled in course!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enroll");
      setTimeout(() => setError(""), 3000);
    } finally {
      setEnrollingCourseId(null);
    }
  };

  return (
    <PageShell searchPlaceholder="Search courses...">
      <div className="mx-auto max-w-[1280px] px-6 py-10">
        {/* Featured + quick access */}
        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          <div className="relative overflow-hidden rounded-2xl shadow-[var(--shadow-card)]">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-deep/95 via-primary-deep/70 to-transparent" />
            <div className="relative p-8 text-primary-foreground md:p-10">
              <span className="inline-block rounded-md bg-energy px-3 py-1 text-xs font-bold uppercase tracking-wider text-energy-foreground">Featured Program</span>
              <h2 className="mt-4 max-w-md text-3xl font-extrabold leading-tight md:text-4xl">Start Your Training Journey</h2>
              <p className="mt-3 max-w-md text-primary-foreground/80">Explore our comprehensive training modules and advance your skills in your field.</p>
              <div className="mt-6 flex gap-3">
                <button className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Browse Courses</button>
                <button className="rounded-md bg-foreground/30 px-5 py-2.5 text-sm font-semibold text-primary-foreground backdrop-blur transition hover:bg-foreground/40">Learn More</button>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl bg-primary-deep p-6 text-primary-foreground shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-energy">
                <BadgeCheck className="h-4 w-4" /> Certified Training
              </div>
              <h3 className="mt-3 text-2xl font-bold">{courses.length} Active Courses</h3>
              <p className="mt-2 text-sm text-primary-foreground/80">Enroll in courses and track your progress.</p>
            </div>
            <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
              <h3 className="font-bold">Your Dashboard</h3>
              <p className="mt-1 text-sm text-muted-foreground">Track your enrolled courses and progress.</p>
              <Link to="/training/dashboard" className="mt-4 flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm font-semibold text-primary-deep hover:bg-muted">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Catalog */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="space-y-8">
            <div>
              <h3 className="text-lg font-bold">Categories</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {categories.map((c, i) => (
                  <li key={c} className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked={i === 0} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold">Certification Level</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {tiers.map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <input type="radio" name="tier" className="h-4 w-4 border-border text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-primary-deep p-5 text-primary-foreground shadow-[var(--shadow-card)]">
              <BarChart3 className="h-6 w-6 text-energy" />
              <h4 className="mt-3 font-bold">Admin Panel</h4>
              <p className="mt-1 text-xs text-primary-foreground/80">Access admin controls and analytics.</p>
              <Link to="/training/admin" className="mt-4 block w-full rounded-md bg-primary-foreground py-2 text-center text-sm font-semibold text-primary-deep hover:bg-primary-foreground/90">Admin Dashboard</Link>
            </div>
          </aside>

          <div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-3xl font-extrabold">Course Catalog</h2>
                <p className="text-sm text-muted-foreground">Showing {courses.length} course{courses.length !== 1 ? "s" : ""}</p>
              </div>
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-800">{successMessage}</div>
              )}
            </div>
            {loading ? (
              <p className="mt-6 text-muted-foreground">Loading courses...</p>
            ) : courses.length === 0 ? (
              <p className="mt-6 text-muted-foreground">No courses available yet.</p>
            ) : (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {courses.map((course) => (
                  <article key={course.id} className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-0.5">
                    <div className="relative h-44 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      {course.image ? (
                        <img src={course.image} alt={course.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <BadgeCheck className="h-16 w-16 text-primary/30" />
                      )}
                      <span className="absolute right-3 top-3 rounded-md bg-foreground/80 px-2 py-1 text-[10px] font-bold tracking-wider text-background">{course.hours} HOURS</span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center justify-between">
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">{course.category}</span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><Star className="h-3.5 w-3.5 fill-primary text-primary" />{course.tier}</span>
                      </div>
                      <h3 className="mt-3 font-bold leading-snug">{course.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
                      <div className="mt-auto flex items-center justify-between pt-5">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                          {new Date(course.created_at).toLocaleDateString()}
                        </span>
                        {user?.role === "TRAINER" ? (
                          <button disabled className="rounded-full bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground">
                            Trainer
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEnroll(course.id)}
                            disabled={enrollingCourseId === course.id}
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {enrollingCourseId === course.id ? "Enrolling..." : "Enroll"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
