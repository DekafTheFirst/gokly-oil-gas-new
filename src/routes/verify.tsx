import { useState } from "react";
import { ShieldCheck, QrCode, BadgeCheck, Download, Share2, Database, Lock, FileCheck2, Award } from "lucide-react";
import { PageShell } from "@/components/educert/PageShell";
import trainingImg from "@/assets/course-pipeline.jpg";

export default function Verify() {
  const [id, setId] = useState("ECP-2024-8842");
  return (
    <PageShell searchPlaceholder="Search certificates...">
      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <header className="text-center">
          <h1 className="text-5xl font-extrabold leading-tight md:text-6xl">Verify Official Credentials</h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            Instantly validate Gokly oil &amp; gas certifications. Our high-performance compliance system ensures the integrity of field operations through secure, immutable records.
          </p>
        </header>

        <div className="mt-10 rounded-2xl bg-card p-3 shadow-[var(--shadow-card)]">
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-center gap-3 md:flex-nowrap">
            <div className="relative flex-1">
              <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Enter 12-digit Certificate ID (e.g., ECP-2024-8842)"
                className="h-14 w-full rounded-xl bg-input pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button className="h-14 rounded-xl bg-primary px-8 text-sm font-bold text-primary-foreground transition hover:bg-primary-deep md:w-auto w-full">Verify Now</button>
            <button type="button" aria-label="Scan QR" className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-input text-primary hover:bg-muted">
              <QrCode className="h-6 w-6" />
            </button>
          </form>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Result card */}
          <article className="rounded-2xl bg-card p-8 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary"><Award className="h-7 w-7" /></div>
                <div>
                  <h2 className="text-2xl font-extrabold">Offshore Safety Supervisor</h2>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-primary">Credential Valid</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" /> System Verified
              </span>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-6 border-t border-border pt-6 sm:grid-cols-2">
              <Field label="Holder Name" value="Commander Robert J. Miller" />
              <Field label="Organization" value="Terminal 4 Field Operations" />
              <Field label="Issue Date" value="March 14, 2024" />
              <Field label="ID Number" value="ECP-2024-8842-X90" mono />
              <Field label="Expiry Date" value="March 14, 2026" />
              <div>
                <p className="label-eyebrow">HSE Standard</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">OSHA-30</span>
                  <span className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">BOSIET</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
              <div className="flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-deep"><Download className="h-4 w-4" /> Download PDF</button>
                <button className="inline-flex items-center gap-2 rounded-md border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground"><Share2 className="h-4 w-4" /> Share Validation Link</button>
              </div>
              <button className="text-sm font-semibold text-muted-foreground hover:text-destructive">Report Discrepancy</button>
            </div>
          </article>

          {/* Insights + training centre */}
          <aside className="space-y-6">
            <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-energy/20"><BadgeCheck className="h-5 w-5 text-energy-foreground" /></div>
                <h3 className="text-lg font-bold">Validation Insights</h3>
              </div>
              <div className="mt-5 flex items-center justify-between text-sm">
                <span>Verification Count</span>
                <span className="font-bold">14 Times</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-3/4 rounded-full bg-primary" />
              </div>
              <p className="mt-4 text-xs italic text-muted-foreground">Last verified by British Petroleum Procurement Div. 2 days ago.</p>
            </div>

            <div className="relative h-64 overflow-hidden rounded-2xl shadow-[var(--shadow-card)]">
              <img src={trainingImg} alt="Training centre" className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-deep/95 via-primary-deep/30 to-transparent" />
              <div className="absolute bottom-0 p-5 text-primary-foreground">
                <p className="font-bold">Official Training Center</p>
                <p className="text-sm text-primary-foreground/85">Terminal 4 — Aberdeen Coastal Hub</p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <span className="inline-flex items-center gap-2"><FileCheck2 className="h-4 w-4" /> ISO 9001 Certified</span>
          <span className="inline-flex items-center gap-2"><Lock className="h-4 w-4" /> AES-256 Encrypted</span>
          <span className="inline-flex items-center gap-2"><Database className="h-4 w-4" /> Compliant Registry</span>
        </div>
      </div>
    </PageShell>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="label-eyebrow">{label}</p>
      <p className={`mt-2 text-base font-semibold ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
