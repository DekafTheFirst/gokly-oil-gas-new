import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Landmark,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  fetchEngagementInvoice,
  fetchEngagementInvoiceStatus,
  payEngagementInvoice,
  type EngagementInvoice,
} from "@/lib/engagements";
import { Logo } from "@/components/educert/Logo";
import Footer from "@/components/Footer";

const formatNaira = (amount: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export default function EngagementInvoicePage() {
  const { reference } = useParams<{ reference: string }>();
  const [searchParams] = useSearchParams();
  const [invoice, setInvoice] = useState<EngagementInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payerEmail, setPayerEmail] = useState("");
  const [paid, setPaid] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (!reference) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchEngagementInvoice(reference)
      .then((response) => {
        if (cancelled) return;
        setInvoice(response.invoice);
        setPaid(response.invoice.status === "PAID");
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reference]);

  // Returning from Paystack — poll the status endpoint which reconciles
  // with the gateway, then show the outcome.
  useEffect(() => {
    if (!reference || searchParams.get("payment") !== "return" || paid) return;
    let cancelled = false;
    let attempts = 0;
    setCheckingStatus(true);
    const poll = async () => {
      attempts += 1;
      try {
        const result = await fetchEngagementInvoiceStatus(reference);
        if (cancelled) return;
        if (result.paid) {
          setPaid(true);
          setCheckingStatus(false);
          toast.success("Payment confirmed — thank you.");
          return;
        }
      } catch {
        // ignore — keep polling a few times
      }
      if (!cancelled && attempts < 5) {
        window.setTimeout(() => void poll(), 2500);
      } else if (!cancelled) {
        setCheckingStatus(false);
        toast.info("Payment is still being confirmed — refresh in a moment.");
      }
    };
    void poll();
    return () => {
      cancelled = true;
    };
  }, [reference, searchParams, paid]);

  const handlePay = async () => {
    if (!reference) return;
    setPaying(true);
    try {
      const response = await payEngagementInvoice(reference, payerEmail.trim() || undefined);
      window.location.href = response.authorization_url;
    } catch (error) {
      console.error("Failed to start payment:", error);
      toast.error(error instanceof Error ? error.message : "Could not start checkout. Please try again.");
      setPaying(false);
    }
  };

  const totalTrainees = invoice?.items.reduce((sum, item) => sum + (Number(item.agreed_quantity) || 0), 0) ?? 0;

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <header className="border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Logo />
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 sm:flex">
            <Lock className="h-3.5 w-3.5" />
            Secure Invoice
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
            Loading invoice…
          </div>
        ) : notFound || !invoice ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <FileText className="mx-auto h-10 w-10 text-slate-300" />
            <h1 className="mt-4 text-lg font-bold text-slate-900">Invoice not found</h1>
            <p className="mt-2 text-sm text-slate-500">
              This payment link is invalid or has been replaced. Please contact Gokly for a new invoice.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/contact">Contact Gokly</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status banner */}
            {paid ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-bold text-emerald-900">Payment received — invoice settled</p>
                    <p className="text-sm text-emerald-800">
                      {invoice.engagement_name} ({invoice.engagement_reference}) has been paid in full. A receipt will follow by email.
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="shrink-0 border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100">
                  <Link to="/">Done —  Back to Gokly</Link>
                </Button>
              </div>
            ) : checkingStatus ? (
              <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
                <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                <p className="text-sm font-semibold text-amber-900">Confirming your payment with Paystack…</p>
              </div>
            ) : null}

            {/* Invoice card */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-[#006030] to-[#1b7a43] px-6 py-5 text-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-100">
                      Official Commercial Invoice
                    </p>
                    <h1 className="mt-1 text-xl font-bold">{invoice.engagement_name}</h1>
                    <p className="mt-0.5 font-mono text-xs text-emerald-100">{invoice.engagement_reference}</p>
                  </div>
                  <div className="text-right text-xs text-emerald-50">
                    <p>Prepared for</p>
                    <p className="font-semibold text-white">{invoice.organization_name || "Client"}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-6 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Training items</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{invoice.items.length}</p>
                  <p className="text-xs font-medium text-emerald-700">{totalTrainees} agreed trainees</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Settlement terms</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{invoice.payment_terms || "As per agreement"}</p>
                  <p className="text-xs text-amber-700">
                    {invoice.payment_due_window
                      ? `Due window: ${invoice.payment_due_window}`
                      : invoice.expected_completion
                        ? `Completion: ${formatDate(invoice.expected_completion)}`
                        : ""}
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Amount due</p>
                  <p className="mt-1 text-lg font-bold text-emerald-800">
                    {formatNaira(invoice.total_amount, invoice.currency)}
                  </p>
                  <p className="text-xs text-slate-500">{invoice.currency}</p>
                </div>
              </div>

              {/* Line items */}
              <div className="px-6 pb-6">
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="admin-table min-w-[560px]">
                    <thead>
                      <tr>
                        <th>Training item</th>
                        <th className="text-center">Trainees</th>
                        <th className="text-right">Unit price</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <p className="font-semibold">{item.course_name || "Training item"}</p>
                            {item.curriculum_notes && (
                              <p className="mt-0.5 text-xs text-slate-500">{item.curriculum_notes}</p>
                            )}
                          </td>
                          <td className="text-center font-semibold">{item.agreed_quantity}</td>
                          <td className="text-right">{formatNaira(item.unit_price, invoice.currency)}</td>
                          <td className="text-right font-semibold">
                            {formatNaira(item.calculated_total ?? item.agreed_quantity * item.unit_price, invoice.currency)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50">
                        <td colSpan={3} className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Agreement total
                        </td>
                        <td className="text-right text-base font-bold text-emerald-800">
                          {formatNaira(invoice.total_amount, invoice.currency)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {(invoice.expected_delivery_start || invoice.expected_completion) && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Delivery window: {formatDate(invoice.expected_delivery_start)} – {formatDate(invoice.expected_completion)}
                  </div>
                )}
              </div>
            </section>

            {/* Pay action */}
            {!paid && invoice.status !== "PAID" && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                {invoice.status === "EXPIRED" ? (
                  <div className="text-center">
                    <Clock3 className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 font-semibold text-slate-700">This payment link has expired</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Please contact Gokly to request a new invoice for {invoice.engagement_reference}.
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-4">
                      <Link to="/contact">Contact Gokly</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Pay {formatNaira(invoice.total_amount, invoice.currency)}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Secure checkout via Paystack — card or bank transfer. You'll be redirected to complete payment.
                        </p>
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                      <Input
                        type="email"
                        placeholder="Billing email (optional)"
                        value={payerEmail}
                        onChange={(event) => setPayerEmail(event.target.value)}
                        className="sm:w-56"
                        aria-label="Billing email"
                      />
                      <Button onClick={() => void handlePay()} disabled={paying} className="shrink-0">
                        {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />}
                        Pay now
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            )}

          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-[11px] text-slate-400">
        <p className="mx-auto flex max-w-4xl items-center justify-center gap-1.5 px-4">
          <BadgeCheck className="h-3.5 w-3.5" />
          Processed securely by Paystack{invoice ? ` · Ref ${invoice.reference.slice(0, 10)}…` : ""}
        </p>
      </footer>
      <Footer />
    </div>
  );
}
