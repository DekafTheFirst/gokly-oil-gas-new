import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, ShieldAlert, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptAccountInvite, fetchAccountInvite } from "@/lib/auth";

type PageState = "loading" | "ready" | "invalid" | "done";

const SetPassword = () => {
  const location = useLocation();
  const started = useRef(false);
  const token = new URLSearchParams(location.search).get("token");
  const [state, setState] = useState<PageState>(token ? "loading" : "invalid");
  const [invite, setInvite] = useState<{ name: string; email: string } | null>(null);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setMessage("This invite link is missing its token. Ask your administrator to resend the invite.");
      return;
    }
    fetchAccountInvite(token)
      .then((response) => {
        setInvite(response);
        setState("ready");
      })
      .catch((error: unknown) => {
        setState("invalid");
        setMessage(error instanceof Error ? error.message : "This invite link is invalid or has expired.");
      });
  }, [token]);

  const passwordError = (() => {
    if (!password) return "";
    if (password.length < 8) return "At least 8 characters.";
    if (!/[a-z]/i.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return "Include a letter, a number, and a symbol.";
    }
    return "";
  })();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !invite) return;
    if (passwordError) {
      setMessage(passwordError);
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const response = await acceptAccountInvite(token, password);
      setState("done");
      setMessage(response.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not set your password. The link may have expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Set your password</h1>
            <p className="text-xs text-slate-500">Activate your Gokly trainee account</p>
          </div>
        </div>

        {state === "loading" && (
          <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Checking your invite link…
          </div>
        )}

        {state === "invalid" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{message}</span>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth/login">Go to login</Link>
            </Button>
          </div>
        )}

        {state === "done" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{message}</span>
            </div>
            <Button asChild className="w-full bg-emerald-700 hover:bg-emerald-800">
              <Link to="/auth/login">Log in to Gokly</Link>
            </Button>
          </div>
        )}

        {state === "ready" && invite && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
              <UserRound className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-slate-800">{invite.name}</span>
              <span className="truncate text-slate-500">· {invite.email}</span>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && <p className="text-xs text-amber-700">{passwordError}</p>}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
              />
            </div>

            {message && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {message}
              </div>
            )}

            <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800" disabled={submitting}>
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Set password & activate account"}
            </Button>
            <p className="text-center text-xs text-slate-400">
              This link expires 7 days after it was sent.
            </p>
          </form>
        )}
      </div>
    </main>
  );
};

export default SetPassword;
