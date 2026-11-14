import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Banknote,
  CheckCircle2,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  fetchEngagementPaymentStatus,
  requestEngagementInvoiceEmail,
  type EngagementPaymentStatus,
  type EngagementRecord,
} from "@/lib/engagements";

const formatNaira = (naira: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(naira || 0);

const koboToNaira = (kobo: number) => kobo / 100;

const ATTEMPT_STYLES: Record<string, string> = {
  SUCCESSFUL: "border-emerald-200 bg-emerald-50 text-emerald-800",
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  INITIALIZING: "border-slate-200 bg-slate-50 text-slate-600",
  FAILED: "border-red-200 bg-red-50 text-red-800",
  EXPIRED: "border-slate-200 bg-slate-100 text-slate-500",
};

const ATTEMPT_LABELS: Record<string, string> = {
  SUCCESSFUL: "Paid",
  PENDING: "Awaiting payment",
  INITIALIZING: "Initializing",
  FAILED: "Failed",
  EXPIRED: "Expired",
};

export function EngagementPaymentsTab({ engagement }: { engagement: EngagementRecord }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<EngagementPaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      const response = await fetchEngagementPaymentStatus(engagement.id);
      setStatus(response);
      return response;
    } catch (error) {
      console.error("Failed to load engagement payment status:", error);
      toast.error("Failed to load payment status");
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchEngagementPaymentStatus(engagement.id)
      .then((response) => {
        if (cancelled) return;
        setStatus(response);
        // Returning from Paystack — the status endpoint already reconciled
        // with the gateway, so just surface the outcome and clean the URL.
        if (searchParams.get("payment") === "paystack") {
          const latest = response.latest;
          if (latest?.status === "SUCCESSFUL") {
            toast.success("Payment received — this engagement is now paid.");
          } else if (latest && ["PENDING", "INITIALIZING"].includes(latest.status)) {
            toast.info("Payment is still pending confirmation.");
          }
          setSearchParams({}, { replace: true });
        }
      })
      .catch((error) => {
        console.error("Failed to load engagement payment status:", error);
        if (!cancelled) toast.error("Failed to load payment status");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagement.id]);

  const isPaid = status?.payments.some((p) => p.status === "SUCCESSFUL") ?? false;
  const latest = status?.latest ?? null;

  const handleSendInvoice = async () => {
    setSending(true);
    try {
      const response = await requestEngagementInvoiceEmail(engagement.id);
      setInvoiceUrl(response.invoice_url);
      setSentTo(response.sent_to);
      toast.success(`Invoice emailed to ${response.sent_to}.`);
      await loadStatus();
    } catch (error) {
      console.error("Failed to send invoice email:", error);
      toast.error(error instanceof Error ? error.message : "Could not send the invoice email");
    } finally {
      setSending(false);
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Payment link copied.");
    } catch {
      toast.error("Could not copy — select and copy the link manually.");
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
        Loading payment details…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">Engagement payment</h2>
          </div>
          {isPaid ? (
            <Badge variant="outline" className="w-fit border-emerald-200 bg-emerald-50 px-3 py-1.5 font-bold text-emerald-800">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Paid in full
            </Badge>
          ) : (
            <Badge variant="outline" className="w-fit border-amber-200 bg-amber-50 px-3 py-1.5 font-bold text-amber-800">
              Outstanding
            </Badge>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Agreement value</span>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {formatNaira(engagement.total_amount, engagement.currency)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Payment terms</span>
            <p className="mt-1 text-sm font-bold text-slate-900">{engagement.payment_terms || "—"}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Latest attempt</span>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {latest ? ATTEMPT_LABELS[latest.status] ?? latest.status : "No checkout yet"}
            </p>
          </div>
        </div>

        {!isPaid && engagement.currency === "NGN" && (
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
            <p className="text-xs leading-relaxed text-slate-600">
              Email the organization a secure invoice link for the full agreement value ({formatNaira(engagement.total_amount, engagement.currency)}).
              They open it on our site, review the agreement summary, and pay via Paystack — no account needed.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => void handleSendInvoice()} disabled={sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                {sentTo ? "Resend invoice email" : "Email invoice to organization"}
              </Button>
              {sentTo && (
                <span className="text-xs text-emerald-700">
                  Last sent to <span className="font-semibold">{sentTo}</span>
                </span>
              )}
            </div>
            {invoiceUrl && (
              <div className="flex flex-col gap-2 rounded-md bg-emerald-50 p-3 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 truncate text-xs text-emerald-900">{invoiceUrl}</code>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => void copyLink(invoiceUrl)}>
                    <Copy className="h-3.5 w-3.5" /> Copy link
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={invoiceUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" /> Preview invoice
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        {!isPaid && engagement.currency !== "NGN" && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-900">
            Online checkout is currently available only for NGN engagements. Record this {engagement.currency} payment offline.
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">Payment history</h2>
          <p className="text-xs text-slate-500">All checkout attempts and confirmed payments for this engagement.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[640px]">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(status?.payments ?? []).map((payment) => (
                <tr key={payment.reference}>
                  <td className="font-mono text-xs">{payment.reference.slice(0, 12)}…</td>
                  <td className="font-semibold">
                    {payment.paid_amount != null
                      ? formatNaira(Number(payment.paid_amount), payment.paid_currency || engagement.currency)
                      : formatNaira(koboToNaira(payment.amount_kobo), engagement.currency)}
                  </td>
                  <td className="text-sm text-slate-600">{payment.payment_method || "—"}</td>
                  <td>
                    <Badge variant="outline" className={ATTEMPT_STYLES[payment.status] ?? ATTEMPT_STYLES.EXPIRED}>
                      {ATTEMPT_LABELS[payment.status] ?? payment.status}
                    </Badge>
                  </td>
                  <td className="text-sm text-slate-600">
                    {payment.payment_date
                      ? new Date(payment.payment_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                      : new Date(payment.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
              {!(status?.payments ?? []).length && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-slate-500">
                    No payment attempts yet. Generate a link above to send to the organization.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
