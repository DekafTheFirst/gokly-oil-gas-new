import { Link } from "react-router-dom";
import { Star, Plus, BarChart3, ArrowRight, BadgeCheck } from "lucide-react";
import { PageShell } from "@/components/educert/PageShell";
import { COURSES } from "@/lib/mock-data";
import heroImg from "@/assets/hero-control-room.jpg";

const categories = ["All Modules", "HSE & Safety", "Offshore Ops", "Technical Tools", "Environmental"];
const tiers = ["Basic (T3)", "Advanced (T2)", "Expert (T1)"];

export default function Courses() {
  return (
    <PageShell searchPlaceholder="Search courses...">
      <div className="mx-auto max-w-[1280px] px-6 py-10">
        {/* Featured + quick access */}
        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          <div className="relative overflow-hidden rounded-2xl shadow-[var(--shadow-card)]">
            <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-deep/95 via-primary-deep/70 to-transparent" />
            <div className="relative p-8 text-primary-foreground md:p-10">
              <span className="inline-block rounded-md bg-energy px-3 py-1 text-xs font-bold uppercase tracking-wider text-energy-foreground">Featured Program</span>
              <h2 className="mt-4 max-w-md text-3xl font-extrabold leading-tight md:text-4xl">Advanced Offshore Safety Mastery</h2>
              <p className="mt-3 max-w-md text-primary-foreground/80">Complete the comprehensive Tier-1 certification required for deepwater operations and rig management.</p>
              <div className="mt-6 flex gap-3">
                <button className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Enroll Now</button>
                <button className="rounded-md bg-foreground/30 px-5 py-2.5 text-sm font-semibold text-primary-foreground backdrop-blur transition hover:bg-foreground/40">View Details</button>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl bg-primary-deep p-6 text-primary-foreground shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-energy">
                <BadgeCheck className="h-4 w-4" /> Global Standards
              </div>
              <h3 className="mt-3 text-2xl font-bold">HSE Compliance 2024</h3>
              <p className="mt-2 text-sm text-primary-foreground/80">Updated regulatory frameworks for midstream operations.</p>
            </div>
            <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
              <h3 className="font-bold">Quick Access</h3>
              <p className="mt-1 text-sm text-muted-foreground">Jump back into your active training modules.</p>
              <Link to="/training/dashboard" className="mt-4 flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm font-semibold text-primary-deep hover:bg-muted">
                Drilling Fluids Engineering <ArrowRight className="h-4 w-4" />
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
              <h4 className="mt-3 font-bold">Track Progress</h4>
              <p className="mt-1 text-xs text-primary-foreground/80">Monitor your organization's compliance score in real-time.</p>
              <Link to="/training/admin" className="mt-4 block w-full rounded-md bg-primary-foreground py-2 text-center text-sm font-semibold text-primary-deep hover:bg-primary-foreground/90">View Analytics</Link>
            </div>
          </aside>

          <div>
            <div className="flex items-end justify-between">
              <h2 className="text-3xl font-extrabold">Course Catalog</h2>
              <span className="text-sm text-muted-foreground">Showing {COURSES.length} of 128 courses</span>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {COURSES.map((c) => (
                <article key={c.id} className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-0.5">
                  <div className="relative h-44">
                    <img src={c.image} alt={c.title} className="h-full w-full object-cover" loading="lazy" />
                    <span className="absolute right-3 top-3 rounded-md bg-foreground/80 px-2 py-1 text-[10px] font-bold tracking-wider text-background">{c.hours} HOURS</span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">{c.category}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-energy-foreground"><Star className="h-3.5 w-3.5 fill-energy text-energy" />{c.rating}</span>
                    </div>
                    <h3 className="mt-3 font-bold leading-snug">{c.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.blurb}</p>
                    <div className="mt-auto flex items-center justify-between pt-5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><BadgeCheck className="h-3.5 w-3.5" />{c.tier}</span>
                      <button aria-label="Enroll" className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground transition hover:bg-primary-deep">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
