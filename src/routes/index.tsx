import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, BarChart3, Stethoscope, Headphones, ScanLine, BadgeCheck } from "lucide-react";
import { TopNav } from "@/components/educert/TopNav";
import { Footer } from "@/components/educert/Footer";
import heroImg from "@/assets/hero-control-room.jpg";
import verifyImg from "@/assets/verify-engineer.jpg";
import { PageShell } from "@/components/educert/PageShell";

export default function HomePage() {
  const [tab, setTab] = useState<"trainee" | "admin">("trainee");
  return (
    <PageShell>
      <div className="flex min-h-screen flex-col bg-background">
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <img src={heroImg} alt="Oil & gas operator monitoring control room" className="absolute inset-0 -z-10 h-full w-full object-cover" width={1600} height={1024} />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary-deep/95 via-primary-deep/85 to-primary-deep/40" />
          <div className="mx-auto grid max-w-[1280px] gap-12 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
            <div className="text-primary-foreground">
              <span className="inline-flex items-center gap-2 rounded-full bg-energy/95 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-energy-foreground shadow-[var(--shadow-card)]">
                <BadgeCheck className="h-3.5 w-3.5" /> Accredited Training Portal
              </span>
              <h1 className="mt-6 max-w-xl text-5xl font-extrabold leading-[1.05] md:text-6xl">
                Master the Field with Professional Precision.
              </h1>
              <p className="mt-6 max-w-lg text-lg text-primary-foreground/85">
                EduCert Pro Oil &amp; Gas certified compliance modules. Designed for high-performance operations and environmental responsibility.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/training/verify" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90">
                  <ScanLine className="h-4 w-4" /> Verify a Certificate
                </Link>
                <Link to="/training/courses" className="inline-flex items-center rounded-md border border-primary-foreground/30 bg-primary-foreground/10 px-5 py-3 font-semibold text-primary-foreground backdrop-blur transition hover:bg-primary-foreground/20">
                  View Course Catalog
                </Link>
              </div>
            </div>
            {/* Sign-in card */}
            <div className="self-center justify-self-stretch rounded-2xl bg-card p-7 shadow-[var(--shadow-overlay)]">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex gap-5">
                  <button onClick={() => setTab("trainee")} className={`pb-2 text-sm font-semibold transition ${tab === "trainee" ? "border-b-2 border-primary text-primary-deep" : "text-muted-foreground"}`}>Sign In</button>
                  <button onClick={() => setTab("admin")} className={`pb-2 text-sm font-semibold transition ${tab === "admin" ? "border-b-2 border-primary text-primary-deep" : "text-muted-foreground"}`}>Register</button>
                </div>
                <span className="text-xs font-medium text-primary">Secure Login</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button onClick={() => setTab("trainee")} className={`rounded-md py-3 text-sm font-semibold transition ${tab === "trainee" ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]" : "border border-border bg-input text-foreground"}`}>👤 Trainee</button>
                <button onClick={() => setTab("admin")} className={`rounded-md py-3 text-sm font-semibold transition ${tab === "admin" ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]" : "border border-border bg-input text-foreground"}`}>🛡️ Admin</button>
              </div>
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Credentials</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="text-sm font-semibold">Employee ID / Email</label>
                  <input defaultValue="GOK-7728-1" className="mt-1 h-11 w-full rounded-md bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Password</label>
                  <input type="password" defaultValue="password" className="mt-1 h-11 w-full rounded-md bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-muted-foreground">
                    <input type="checkbox" className="h-4 w-4 rounded border-border text-primary" /> Remember me
                  </label>
                  <a href="#" className="font-semibold text-primary">Forgot password?</a>
                </div>
                <Link to="/training/dashboard" className="block w-full rounded-md bg-primary py-3 text-center text-sm font-semibold text-primary-foreground transition hover:bg-primary-deep">
                  Access Portal
                </Link>
                <p className="text-center text-xs text-muted-foreground">
                  By logging in, you agree to the EduCert Pro <a className="text-primary" href="#">System Standards</a> and <a className="text-primary" href="#">Conduct Policy</a>.
                </p>
              </form>
            </div>
          </div>
        </section>
        {/* Training Excellence */}
        <section className="mx-auto w-full max-w-[1280px] px-6 py-20">
          <h2 className="text-4xl font-extrabold text-foreground">Training Excellence</h2>
          <p className="mt-2 text-muted-foreground">The industry standard for technical proficiency and safety compliance.</p>
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl bg-card p-8 shadow-[var(--shadow-card)]">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h3 className="mt-5 text-2xl font-bold">Advanced Analytics</h3>
              <p className="mt-2 text-muted-foreground">Real-time performance tracking for fleet-wide safety compliance. Monitor individual progress against global terminal standards.</p>
              <div className="mt-8">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Compliance Level</span>
                  <span className="font-semibold text-primary">75% Target Achieved</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[75%] rounded-full bg-primary" />
                </div>
              </div>
              <div className="mt-6 grid h-48 place-items-center rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground">
                Analytics preview
              </div>
            </div>
            <div className="grid gap-6">
              <div className="rounded-2xl bg-[oklch(0.93_0.05_152)] p-8 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-primary-deep">Instant Certification</h3>
                    <p className="mt-2 max-w-sm text-sm text-primary-deep/80">Digitally signed certificates instantly verifiable via secure ledger for T-4 operations.</p>
                  </div>
                  <BadgeCheck className="h-8 w-8 text-primary-deep" />
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl bg-card p-6 text-center shadow-[var(--shadow-card)]">
                  <ShieldCheck className="mx-auto h-7 w-7 text-primary" />
                  <p className="mt-3 font-bold">HSE Standards</p>
                  <p className="mt-1 text-xs text-muted-foreground">OSHA 1910 Compliant Modules</p>
                </div>
                <div className="rounded-2xl bg-card p-6 text-center shadow-[var(--shadow-card)]">
                  <Headphones className="mx-auto h-7 w-7 text-energy-foreground" />
                  <p className="mt-3 font-bold">Expert Support</p>
                  <p className="mt-1 text-xs text-muted-foreground">24/7 Field Technical Assistance</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Public verification */}
        <section className="mx-auto w-full max-w-[1280px] px-6 pb-20">
          <div className="grid overflow-hidden rounded-2xl bg-primary-deep text-primary-foreground shadow-[var(--shadow-overlay)] lg:grid-cols-2">
            <div className="p-10 lg:p-12">
              <h2 className="text-3xl font-extrabold leading-tight">Public Credential Verification</h2>
              <p className="mt-3 text-primary-foreground/80">
                Trust but verify. Our open ledger allows third-party contractors and safety inspectors to validate operator certifications in real-time without logging in.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="mt-6 flex flex-wrap items-center gap-2">
                <input className="h-11 min-w-[260px] flex-1 rounded-md bg-primary-foreground/10 px-3 text-sm text-primary-foreground placeholder:text-primary-foreground/60 focus:outline-none focus:ring-2 focus:ring-energy" placeholder="Enter Certificate ID" />
                <Link to="/training/verify" className="inline-flex items-center gap-2 rounded-md bg-primary-foreground px-5 py-3 text-sm font-semibold text-primary-deep transition hover:bg-primary-foreground/90">
                  <Stethoscope className="h-4 w-4" /> Check
                </Link>
              </form>
            </div>
            <div className="relative min-h-[280px]">
              <img src={verifyImg} alt="Engineer verifying credentials on tablet" className="absolute inset-0 h-full w-full object-cover" loading="lazy" width={1200} height={900} />
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </PageShell>
  );
}
