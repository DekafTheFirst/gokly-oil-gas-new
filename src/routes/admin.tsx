import { Users, GraduationCap, BadgeCheck, ShieldCheck, Calendar, Download, MoreVertical, Cloud } from "lucide-react";
import { PageShell } from "@/components/educert/PageShell";
import { ACTIVITY, TRAINEES, TRENDS } from "@/lib/mock-data";
import { AdminPageShell } from "@/components/educert/AdminPageShell";

const metrics = [
  { label: "Total Active Users", value: "12,842", chip: "+12.5%", icon: Users, accent: "border-l-primary" },
  { label: "Active Training Modules", value: "142", chip: "89% Cap.", icon: GraduationCap, accent: "border-l-energy" },
  { label: "Certificates Issued", value: "3,502", chip: "Daily Record", icon: BadgeCheck, accent: "border-l-primary" },
  { label: "Compliance Score", value: "98.2%", chip: "Stable", icon: ShieldCheck, accent: "border-l-primary-deep" },
];

export default function Admin() {
  return (
    <AdminPageShell withSidebar searchPlaceholder="Search audit logs...">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">Administrative Overview</h1>
          <p className="mt-2 text-muted-foreground">Real-time platform performance and compliance tracking.</p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted">
            <Calendar className="h-4 w-4" /> Last 30 Days
          </button>
          <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-deep">
            <Download className="h-4 w-4" /> Export Report
          </button>
        </div>
      </div>

      <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className={`rounded-xl border-l-4 bg-card p-5 shadow-[var(--shadow-card)] ${m.accent}`}>
            <div className="flex items-start justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-muted"><m.icon className="h-5 w-5 text-primary" /></div>
              <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">{m.chip}</span>
            </div>
            <p className="label-eyebrow mt-5">{m.label}</p>
            <p className="mt-2 font-display text-3xl font-extrabold">{m.value}</p>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-2/3 rounded-full bg-primary" />
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">Certification Trends</h2>
              <p className="text-sm text-muted-foreground">Monthly distribution of technical certifications</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Offshore</span>
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-energy" /> HSE Safety</span>
            </div>
          </div>
          <div className="mt-8 flex h-56 items-end gap-3">
            {TRENDS.map((t) => {
              const h = Math.max(15, t.v);
              const isPeak = t.v === Math.max(...TRENDS.map((x) => x.v));
              return (
                <div key={t.m} className="flex flex-1 flex-col items-center gap-2">
                  <div className={`w-full rounded-t-md transition ${isPeak ? "bg-primary" : "bg-primary/25"}`} style={{ height: `${h}%` }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.m}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-xl font-bold">Platform Health</h2>
          {[
            { l: "Server Latency", v: "24ms (Optimal)", pct: 90, tone: "bg-primary" },
            { l: "Storage Usage", v: "78%", pct: 78, tone: "bg-energy" },
            { l: "Database Sync", v: "Active", pct: 100, tone: "bg-primary" },
          ].map((h) => (
            <div key={h.l} className="mt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{h.l}</span>
                <span className="font-semibold text-muted-foreground">{h.v}</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${h.tone}`} style={{ width: `${h.pct}%` }} />
              </div>
            </div>
          ))}
          <div className="mt-6 flex items-center gap-3 rounded-md bg-primary/10 p-4 text-sm font-semibold text-primary-deep">
            <Cloud className="h-5 w-5 text-primary" /> All Systems Operational
          </div>
        </div>
      </section>

      {/* Certificate Mgmt preview */}
      <section className="mt-8 rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Certificate Management</h2>
            <p className="text-sm text-muted-foreground">Validate and issue certifications for personnel.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-deep">
            <BadgeCheck className="h-4 w-4" /> Bulk Issue Selected
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left label-eyebrow">
                <th className="py-3"></th>
                <th className="py-3">Trainee</th>
                <th className="py-3">Course</th>
                <th className="py-3">Score</th>
                <th className="py-3">Date</th>
                <th className="py-3">Status</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {TRAINEES.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="py-4"><input type="checkbox" className="h-4 w-4 rounded border-border text-primary" /></td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{t.initials}</div>
                      <div>
                        <p className="font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {t.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">{t.course}</td>
                  <td className="py-4 font-semibold text-primary">{t.score}%</td>
                  <td className="py-4">{t.date}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.status === "Issued" ? "bg-primary/10 text-primary" : "bg-energy/20 text-energy-foreground"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${t.status === "Issued" ? "bg-primary" : "bg-energy"}`} />
                      {t.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    {t.status === "Pending" ? (
                      <button className="rounded-md border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground">Issue Now</button>
                    ) : (
                      <button aria-label="more" className="text-muted-foreground hover:text-foreground"><MoreVertical className="h-4 w-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Platform Activity */}
      <section className="mt-8 rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Recent Platform Activity</h2>
            <p className="text-sm text-muted-foreground">Live feed of global certification events</p>
          </div>
          <button className="text-sm font-semibold text-primary hover:text-primary-deep">View Full Audit Log →</button>
        </div>
        <div className="mt-5 divide-y divide-border">
          {ACTIVITY.map((a) => (
            <div key={a.certId} className="grid grid-cols-1 items-center gap-3 py-4 md:grid-cols-[1.5fr_1.2fr_1fr_1fr_0.8fr_40px]">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{a.initials}</div>
                <div>
                  <p className="font-semibold">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.role}</p>
                </div>
              </div>
              <div><span className="rounded-md bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">{a.module}</span></div>
              <p className="text-sm">{a.time}</p>
              <p className="text-sm font-mono text-muted-foreground">{a.certId}</p>
              <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${a.status === "Issued" ? "bg-primary/10 text-primary" : "bg-energy/20 text-energy-foreground"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${a.status === "Issued" ? "bg-primary" : "bg-energy"}`} />
                {a.status}
              </span>
              <button aria-label="more" className="justify-self-end text-muted-foreground hover:text-foreground"><MoreVertical className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}
