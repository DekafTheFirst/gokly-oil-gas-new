import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  LoaderCircle,
  Mail,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyEmail } from "@/lib/auth";

type VerificationState = "verifying" | "verified" | "invalid";

type VerifiedAccount = {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  trainee_number: string | null;
};

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const started = useRef(false);
  const [state, setState] = useState<VerificationState>("verifying");
  const [message, setMessage] = useState("Confirming your email address. This should only take a moment.");
  const [account, setAccount] = useState<VerifiedAccount | null>(null);
  const token = new URLSearchParams(location.search).get("token");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!token) {
      setState("invalid");
      setMessage("This confirmation link is missing its token. Request another email to continue.");
      return;
    }

    verifyEmail(token)
      .then((response) => {
        setAccount(response.account);
        setState("verified");
        setMessage(response.message);
        navigate(location.pathname, { replace: true });
      })
      .catch((error: unknown) => {
        setState("invalid");
        setMessage(error instanceof Error ? error.message : "This confirmation link is invalid or has expired.");
      });
  }, [location.pathname, navigate, token]);

  const fullName = account
    ? [account.first_name, account.middle_name, account.last_name].filter(Boolean).join(" ")
    : "";
  const isVerified = state === "verified";
  const isInvalid = state === "invalid";

  return (
    <main className="min-h-screen bg-[#f8f9ff] px-4 text-[#121c2a] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 py-8 md:gap-8 md:py-12">
          <section className="relative flex py-5 flex-col items-center overflow-hidden rounded-2xl bg-white px-5 py-9 text-center shadow-[0_12px_40px_rgba(18,28,42,0.08)] sm:px-10 sm:py-12 md:px-14">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#afeec2]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#006030]/10 blur-3xl" />
            <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#b2f1c5] text-[#006030] shadow-md">
              {state === "verifying" ? (
                <LoaderCircle className="h-10 w-10 animate-spin" aria-hidden="true" />
              ) : isVerified ? (
                <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
              ) : (
                <ShieldAlert className="h-10 w-10 text-[#ba1a1a]" aria-hidden="true" />
              )}
            </div>
            <span className={`mb-2 text-xs font-bold uppercase tracking-[0.18em] ${isInvalid ? "text-[#ba1a1a]" : "text-[#006030]"}`}>
              {state === "verifying" ? "Account activation" : isVerified ? "Account activation verified" : "Confirmation needed"}
            </span>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[#121c2a] sm:text-4xl">
              {state === "verifying"
                ? "Confirming your email"
                : isVerified
                  ? "Email verified successfully!"
                  : "We couldn’t verify your email"}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#3f4940] sm:text-lg">
              {isVerified && account ? (
                <>
                  Welcome to Gokly, <strong className="font-semibold text-[#121c2a]">{fullName}</strong>. Your registration email{" "}
                  <span className="break-all font-medium text-[#006030]">{account.email}</span> is confirmed. You can now sign in to your trainee account.
                </>
              ) : message}
            </p>

            {isVerified && account && (
              <>
                <section className="mt-8 w-full rounded-xl bg-[#eff4ff] p-5 text-left sm:p-6">
                  <div className="mb-5 flex flex-col justify-between gap-3 border-b border-[#becabd]/40 pb-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <UserRound className="h-5 w-5 text-[#006030]" />
                      <h2 className="font-heading text-base font-semibold">Account details</h2>
                    </div>
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#afeec2] px-3 py-1 text-xs font-bold text-[#135131]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#006030]" />
                      Verified &amp; active
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#3f4940]">Trainee identifier</p>
                      <p className="mt-1 break-words font-heading text-xl font-bold tracking-tight">
                        {account.trainee_number || "Available after sign-in"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#3f4940]">Account name</p>
                      <p className="mt-1 break-words font-semibold">{fullName}</p>
                    </div>
                    <div className="sm:col-span-2 md:col-span-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#3f4940]">Email address</p>
                      <p className="mt-1 break-all font-semibold">{account.email}</p>
                    </div>
                  </div>
                </section>

                <section className="mt-8 w-full">
                  <div className="mb-4 flex flex-col justify-between gap-2 text-left sm:flex-row sm:items-center">
                    <h2 className="font-heading text-xl font-bold">What’s next?</h2>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#3f4940]">Your next steps</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
                    <Link to="/auth/login" className="group flex min-h-40 flex-col justify-between rounded-xl bg-[#f8f9ff] p-5 shadow-sm transition-shadow hover:shadow-md">
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1b7a43] text-xs font-bold text-white">01</span>
                          <UserRound className="h-5 w-5 text-[#006030]" />
                        </div>
                        <h3 className="font-heading font-semibold">Sign in to your account</h3>
                        <p className="mt-1 text-xs leading-relaxed text-[#3f4940]">Use the email and password you chose during registration.</p>
                      </div>
                      <span className="mt-4 inline-flex items-center gap-1 border-t border-[#becabd]/30 pt-3 text-xs font-semibold text-[#006030]">
                        Go to sign in <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>
                    <Link to="/services" className="group flex min-h-40 flex-col justify-between rounded-xl bg-[#f8f9ff] p-5 shadow-sm transition-shadow hover:shadow-md">
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1b7a43] text-xs font-bold text-white">02</span>
                          <BookOpen className="h-5 w-5 text-[#006030]" />
                        </div>
                        <h3 className="font-heading font-semibold">Explore Gokly services</h3>
                        <p className="mt-1 text-xs leading-relaxed text-[#3f4940]">Learn about our training and capacity development services.</p>
                      </div>
                      <span className="mt-4 inline-flex items-center gap-1 border-t border-[#becabd]/30 pt-3 text-xs font-semibold text-[#006030]">
                        Explore services <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>
                  </div>
                </section>

                <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
                  <Button asChild className="h-12 bg-[#1b7a43] px-7 font-bold text-white hover:bg-[#006030]">
                    <Link to="/auth/login">Go to sign in <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                  <Button asChild variant="outline" className="h-12 border-[#becabd] px-7 font-semibold text-[#121c2a] hover:bg-[#dee9fc]">
                    <Link to="/services"><BookOpen className="mr-2 h-4 w-4" />Browse services</Link>
                  </Button>
                </div>
              </>
            )}

            {isInvalid && (
              <div className="mt-7 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
                <Button asChild className="h-12 bg-[#1b7a43] px-7 font-bold text-white hover:bg-[#006030]">
                  <Link to="/register">Return to registration</Link>
                </Button>
                <Button asChild variant="outline" className="h-12 border-[#becabd] px-7 font-semibold text-[#121c2a]">
                  <Link to="/contact">Contact support</Link>
                </Button>
              </div>
            )}
          </section>

          <section className="flex flex-col items-start justify-between gap-5 rounded-xl bg-[#e6eeff] p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#d9e3f6] text-[#006030]">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-sm font-semibold">Security &amp; account notice</h2>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-[#3f4940]">
                  Your email has been confirmed. If you did not create this trainee account, please contact the Gokly support team.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="shrink-0 border-[#becabd] bg-white/70 text-xs font-semibold text-[#121c2a] hover:bg-white">
              <Link to="/contact"><Mail className="mr-2 h-4 w-4" />Contact support</Link>
            </Button>
          </section>
        </div>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-[#d9e3f6]/70 px-2 py-5 text-center text-xs text-[#3f4940] sm:flex-row sm:text-left">
          <span>Gokly Oil &amp; Gas Trainee Portal</span>
          <Link to="/contact" className="font-medium text-[#006030] hover:underline">Need help? Contact support</Link>
        </footer>
      </div>
    </main>
  );
};

export default VerifyEmail;
