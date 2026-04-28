import { Link } from "react-router-dom";
import { Flame, Clock, BadgeCheck, Trophy, Download, MoreVertical } from "lucide-react";
import { PageShell } from "@/components/educert/PageShell";
import rigImg from "@/assets/course-rig.jpg";
import subseaImg from "@/assets/course-subsea.jpg";
import hazmatImg from "@/assets/course-hazmat.jpg";

const stats = [
  { label: "Training Streak", value: "14 Days", icon: Flame, sub: "Top 5% of Terminal 4 staff", tone: "text-energy-foreground" },
  { label: "Course Hours", value: "128.5", icon: Clock, sub: "+12.4h from last month", tone: "text-primary" },
  { label: "Certifications", value: "09", icon: BadgeCheck, sub: "Active & Compliant", tone: "text-primary" },
  { label: "Global Rank", value: "#242", icon: Trophy, sub: "Across all offshore facilities", tone: "text-primary-deep" },
];

export default function Dashboard() {
  return (
    <PageShell withSidebar searchPlaceholder="Search safety procedures...">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-2xl bg-primary-deep p-10 text-primary-foreground shadow-[var(--shadow-card)]">
        <img src={subseaImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-15" loading="lazy" />
        <div className="relative max-w-2xl">
          <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">Welcome back, Chief Inspector Marshall.</h1>
          <p className="mt-4 text-primary-foreground/85">
            Your HSE certification expires in 12 days. Complete the offshore safety refresher to maintain site compliance.
          </p>
          <button className="mt-6 inline-flex items-center gap-2 rounded-md bg-energy px-5 py-3 font-semibold text-energy-foreground shadow-[var(--shadow-card)] transition hover:brightness-95">
            Continue Refresher Module
          </button>
        </div>
      </section>

      <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between">
              <p className="label-eyebrow">{s.label}</p>
              <s.icon className={`h-5 w-5 ${s.tone}`} />
            </div>
            <p className="mt-3 font-display text-3xl font-extrabold">{s.value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold">Ongoing Training Modules</h2>
            <Link to="/training/courses" className="text-sm font-semibold text-primary hover:text-primary-deep">View Course Catalog →</Link>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <ModuleCard img={rigImg} tag="TECHNICAL" tagTone="bg-primary/10 text-primary" title="Advanced Deep-Sea Pressure Protocols" meta="14h 20m · Advanced" progress={68} progressTone="bg-primary" />
            <ModuleCard img={hazmatImg} tag="MANDATORY" tagTone="bg-destructive/10 text-destructive" title="Offshore Fire Suppression Systems" meta="8h 45m · Level 2" progress={92} progressTone="bg-energy" />
          </div>

          <div className="mt-6 grid gap-4 overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)] md:grid-cols-[1fr_1.5fr]">
            <div className="relative min-h-[180px] bg-primary-deep">
              <img src={subseaImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" loading="lazy" />
              <span className="absolute bottom-4 left-4 rounded-md bg-energy/90 px-2 py-0.5 text-xs font-bold text-energy-foreground">CORPORATE RESPONSIBILITY</span>
            </div>
            <div className="p-6">
              <span className="rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-foreground">MANAGEMENT</span>
              <h3 className="mt-3 text-lg font-bold">Environmental Stewardship &amp; Carbon Tracking</h3>
              <p className="mt-2 text-sm text-muted-foreground">Learn the latest international standards for carbon emission reporting in high-output industrial environments.</p>
              <button className="mt-4 inline-flex items-center gap-2 rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground">Start Module</button>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Latest Certificates</h3>
              <button aria-label="more"><MoreVertical className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            {[
              { t: "HSE Specialist Level 3", d: "ISSUED OCT 12, 2024" },
              { t: "Offshore Logistics", d: "ISSUED SEP 28, 2024" },
            ].map((c) => (
              <div key={c.t} className="mt-4 flex items-center gap-3 rounded-lg bg-muted/60 p-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/15 text-primary"><BadgeCheck className="h-5 w-5" /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{c.t}</p>
                  <p className="text-xs text-muted-foreground">{c.d}</p>
                </div>
                <button aria-label="download"><Download className="h-4 w-4 text-muted-foreground hover:text-primary" /></button>
              </div>
            ))}
            <button className="mt-4 w-full rounded-md border border-dashed border-border py-2.5 text-sm font-semibold text-primary hover:bg-muted">View All Certifications</button>
          </div>

          <div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
            <h3 className="font-bold">Activity Timeline</h3>
            <ol className="mt-4 space-y-5 border-l-2 border-border pl-4">
              {[
                { t: "Module Completed", d: "Hazard Identification Level 1", time: "2 hours ago", color: "bg-primary" },
                { t: "Exam Passed", d: "Drilling Physics 101 (Score: 98%)", time: "Yesterday, 14:30", color: "bg-energy" },
                { t: "Login Recorded", d: "Station: Aberdeen Hub — Terminal 4", time: "Yesterday, 08:00", color: "bg-muted-foreground" },
              ].map((a) => (
                <li key={a.t} className="relative">
                  <span className={`absolute -left-[22px] top-1 h-3 w-3 rounded-full ${a.color}`} />
                  <p className="text-sm font-semibold">{a.t}</p>
                  <p className="text-xs text-muted-foreground">{a.d}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground/80">{a.time}</p>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </section>
    </PageShell>
  );
}

function ModuleCard({ img, tag, tagTone, title, meta, progress, progressTone }: { img: string; tag: string; tagTone: string; title: string; meta: string; progress: number; progressTone: string; }) {
  return (
    <article className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)]">
      <div className="relative h-44">
        <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
        <span className={`absolute left-3 top-3 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider ${tagTone}`}>{tag}</span>
      </div>
      <div className="p-5">
        <h3 className="font-bold leading-snug">{title}</h3>
        <p className="mt-2 text-xs text-muted-foreground">{meta}</p>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Course Progress</span>
            <span className={`font-bold ${progress >= 90 ? "text-energy-foreground" : "text-primary"}`}>{progress}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${progressTone}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </article>
  );
}
