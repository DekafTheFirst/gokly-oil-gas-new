import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, LoaderCircle, MailCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyEmail } from "@/lib/auth";

type VerificationState = "verifying" | "verified" | "invalid";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const started = useRef(false);
  const [state, setState] = useState<VerificationState>("verifying");
  const [message, setMessage] = useState("Verifying your email address...");
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
        setState("verified");
        setMessage(response.message);
        navigate(location.pathname, { replace: true });
      })
      .catch((error: unknown) => {
        setState("invalid");
        setMessage(error instanceof Error ? error.message : "This confirmation link is invalid or has expired.");
      });
  }, [location.pathname, navigate, token]);

  const Icon = state === "verified" ? CheckCircle2 : state === "invalid" ? ShieldAlert : LoaderCircle;

  return (
    <main className="min-h-[65vh] bg-[#f7f9ff] px-4 py-16">
      <section className="mx-auto max-w-lg rounded-2xl border border-[#e1e8f1] bg-white p-7 text-center shadow-[0_8px_30px_rgba(27,45,73,0.06)] sm:p-10">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${state === "invalid" ? "bg-red-50 text-red-600" : "bg-[#eaf5ed] text-[#247748]"}`}>
          <Icon className={`h-8 w-8 ${state === "verifying" ? "animate-spin" : ""}`} />
        </div>
        <h1 className="mt-5 font-heading text-2xl font-extrabold text-[#17253a]">
          {state === "verified" ? "Email confirmed" : state === "invalid" ? "Confirmation link unavailable" : "Confirming your email"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#66748a]" role="status">{message}</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {state === "verified" ? (
            <Button asChild className="bg-[#1f7544] font-bold text-white hover:bg-[#185f37]">
              <Link to="/auth/login"><MailCheck className="mr-2 h-4 w-4" />Sign in</Link>
            </Button>
          ) : state === "invalid" ? (
            <Button asChild className="bg-[#1f7544] font-bold text-white hover:bg-[#185f37]">
              <Link to="/register">Return to registration</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="border-[#dce4ef] text-[#35445a]">
            <Link to="/">Back to Gokly</Link>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default VerifyEmail;
