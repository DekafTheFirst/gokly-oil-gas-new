import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Info,
  Users,
} from "lucide-react";
import { fetchEngagementById, type EngagementRecord } from "@/lib/engagements";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const formatDate = (value?: string) => {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatCurrency = (amount: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const getStatusStyle = (status: EngagementRecord["status"]) => {
  switch (status) {
    case "CONFIRMED":
    case "IN_PROGRESS":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "COMPLETED":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "OUTSTANDING":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-blue-200 bg-blue-50 text-blue-800";
  }
};

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof FileText;
}) {
  return (
    <div className="flex min-h-32 flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <Icon className="h-4 w-4 shrink-0 text-emerald-700" />
      </div>
      <div className="mt-4">
        <p className="truncate text-xl font-bold text-slate-900">{value}</p>
        <p className="mt-1 text-[11px] text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="whitespace-pre-wrap break-words text-sm font-medium text-slate-900">{value || "—"}</dd>
    </div>
  );
}

export default function EngagementDetails() {
  const { engagementId } = useParams<{ engagementId: string }>();
  const navigate = useNavigate();
  const [engagement, setEngagement] = useState<EngagementRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!engagementId) {
      setLoading(false);
      toast.error("Engagement ID is missing");
      return;
    }

    let cancelled = false;
    const loadEngagement = async () => {
      try {
        setLoading(true);
        const response = await fetchEngagementById(engagementId);
        if (!cancelled) setEngagement(response.engagement);
      } catch (error) {
        console.error("Failed to load engagement:", error);
        if (!cancelled) toast.error("Failed to load engagement details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadEngagement();
    return () => {
      cancelled = true;
    };
  }, [engagementId]);

  const items = engagement?.items ?? [];
  const totalTrainees =
    engagement?.total_trainees ?? items.reduce((total, item) => total + item.agreed_quantity, 0);
  const organizationDetailsPath = engagement?.organization_id
    ? `/training/organization-management/${encodeURIComponent(engagement.organization_id)}`
    : undefined;

  return (
    <AdminPageShell withSidebar>
      <main className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          className="-ml-3 text-slate-600 hover:text-emerald-800"
          onClick={() => navigate("/training/engagement-management")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to engagements
        </Button>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            Loading engagement details...
          </div>
        ) : !engagement ? (
          <section className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-slate-900">Engagement not found</h1>
            <p className="mt-2 text-sm text-slate-500">
              The engagement may have been removed or you may not have access to it.
            </p>
          </section>
        ) : (
          <>
            <div className="flex flex-col justify-between gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <span>Commercial Operations</span>
                  <span aria-hidden="true">/</span>
                  <button
                    type="button"
                    className="hover:text-emerald-800"
                    onClick={() => navigate("/training/engagement-management")}
                  >
                    Engagements
                  </button>
                  <span aria-hidden="true">/</span>
                  <span className="text-emerald-800">Details</span>
                </div>
                <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {engagement.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                  <span className="font-mono font-semibold text-emerald-800">{engagement.reference_id}</span>
                  {engagement.organization_name && (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" />
                      {organizationDetailsPath ? (
                        <button
                          type="button"
                          className="font-medium text-emerald-800 underline-offset-4 hover:underline"
                          onClick={() => navigate(organizationDetailsPath)}
                          aria-label={`View ${engagement.organization_name} details`}
                        >
                          {engagement.organization_name}
                        </button>
                      ) : (
                        engagement.organization_name
                      )}
                    </span>
                  )}
                </div>
              </div>
              <Badge
                variant="outline"
                className={`w-fit shrink-0 px-3 py-1.5 font-bold ${getStatusStyle(engagement.status)}`}
              >
                {engagement.status.replace(/_/g, " ")}
              </Badge>
            </div>

            <section aria-label="Engagement summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Engagement value"
                value={formatCurrency(engagement.total_amount, engagement.currency)}
                detail="Total committed value"
                icon={Banknote}
              />
              <SummaryCard
                label="Training items"
                value={`${engagement.item_count ?? items.length}`}
                detail="Courses and services in scope"
                icon={FileText}
              />
              <SummaryCard
                label="Agreed trainees"
                value={`${totalTrainees}`}
                detail="Contracted participant capacity"
                icon={Users}
              />
              <SummaryCard
                label="Delivery period"
                value={formatDate(engagement.expected_delivery_start)}
                detail={`Completion: ${formatDate(engagement.expected_completion)}`}
                icon={CalendarDays}
              />
            </section>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
              <div className="flex flex-col gap-6 lg:col-span-8">
                <section className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="h-5 w-5 text-emerald-700" />
                      <h2 className="text-lg font-bold text-slate-900">Scope &amp; Operating Agreement</h2>
                    </div>
                    <span className="w-fit rounded bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                      {engagement.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                    {engagement.description || "No engagement description has been provided."}
                  </p>

                  <dl className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Organization
                        </dt>
                        <dd className="break-words text-sm font-bold text-slate-900">
                          {organizationDetailsPath ? (
                            <button
                              type="button"
                              className="text-left text-emerald-800 underline-offset-4 hover:underline"
                              onClick={() => navigate(organizationDetailsPath)}
                              aria-label={`View ${engagement.organization_name} details`}
                            >
                              {engagement.organization_name}
                            </button>
                          ) : (
                            engagement.organization_name || "Not specified"
                          )}
                        </dd>
                        <dd className="text-xs text-slate-600">
                          Primary contact: {engagement.primary_contact || "Not specified"}
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Agreement execution
                        </dt>
                        <dd className="text-sm font-bold text-slate-900">
                          {formatDate(engagement.agreement_execution_date)}
                        </dd>
                        <dd className="text-xs text-slate-600">
                          Delivery: {formatDate(engagement.expected_delivery_start)} –{" "}
                          {formatDate(engagement.expected_completion)}
                        </dd>
                      </div>
                    </div>
                  </dl>

                  {engagement.statutory_notes && (
                    <div className="flex items-start gap-3 rounded-lg bg-emerald-50 p-4">
                      <Info className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800" />
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-slate-900">Operational &amp; statutory notes</h3>
                        <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
                          {engagement.statutory_notes}
                        </p>
                      </div>
                    </div>
                  )}
                </section>

                <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                        Curriculum allocation
                      </p>
                      <h2 className="text-lg font-bold text-slate-900">Training Items Breakdown</h2>
                    </div>
                    <span className="text-xs text-slate-500">
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <div className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      No training items are available for this engagement.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <article
                          key={item.id || `${item.course_id}-${index}`}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-100"
                        >
                          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-emerald-800">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                                  Training item {index + 1}
                                </span>
                                <h3 className="mt-1 break-words text-sm font-bold text-slate-900">
                                  {item.course_name || "Untitled training item"}
                                </h3>
                                {item.curriculum_notes && (
                                  <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
                                    {item.curriculum_notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 text-left md:text-right">
                              <p className="text-sm font-bold text-slate-900">
                                {formatCurrency(
                                  item.calculated_total ?? item.agreed_quantity * item.unit_price,
                                  engagement.currency,
                                )}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatCurrency(item.unit_price, engagement.currency)} per trainee
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3 sm:grid-cols-3">
                            <div className="rounded-md border border-slate-200 bg-white p-2 text-center">
                              <span className="block text-[10px] uppercase text-slate-500">Agreed</span>
                              <span className="text-sm font-bold text-slate-900">{item.agreed_quantity}</span>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-white p-2 text-center">
                              <span className="block text-[10px] uppercase text-slate-500">Unit price</span>
                              <span className="text-sm font-bold text-slate-900">
                                {formatCurrency(item.unit_price, engagement.currency)}
                              </span>
                            </div>
                            <div className="col-span-2 rounded-md border border-slate-200 bg-white p-2 text-center sm:col-span-1">
                              <span className="block text-[10px] uppercase text-slate-500">Item total</span>
                              <span className="text-sm font-bold text-emerald-800">
                                {formatCurrency(
                                  item.calculated_total ?? item.agreed_quantity * item.unit_price,
                                  engagement.currency,
                                )}
                              </span>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <span>
                      Total agreed capacity: <strong className="text-slate-900">{totalTrainees} trainees</strong>
                    </span>
                    <span>
                      Agreement reference: <strong className="font-mono text-slate-900">{engagement.reference_id}</strong>
                    </span>
                  </div>
                </section>

                <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      Cohorts &amp; execution
                    </p>
                    <h2 className="text-lg font-bold text-slate-900">Scheduled Training Batches</h2>
                  </div>
                  <div className="flex flex-col items-center gap-2 rounded-lg bg-slate-50 px-4 py-8 text-center">
                    <Clock3 className="h-6 w-6 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700">Batch information is not available</p>
                    <p className="max-w-lg text-xs leading-relaxed text-slate-500">
                      Batch schedules and enrollment are not included in this engagement record.
                    </p>
                  </div>
                </section>
              </div>

              <aside className="flex flex-col gap-6 lg:col-span-4">
                <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-amber-700" />
                      <h2 className="text-lg font-bold text-slate-900">Financials Ledger</h2>
                    </div>
                    <span className="rounded bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-900">
                      {engagement.currency}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 rounded-lg bg-slate-50 p-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Gross engagement value
                    </span>
                    <span className="break-words text-2xl font-bold tracking-tight text-slate-900">
                      {formatCurrency(engagement.total_amount, engagement.currency)}
                    </span>
                    <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-2 text-[11px]">
                      <span className="text-slate-500">Engagement status</span>
                      <span className="font-bold text-emerald-800">{engagement.status.replace(/_/g, " ")}</span>
                    </div>
                  </div>

                  <dl className="space-y-3">
                    <Detail label="Payment terms" value={engagement.payment_terms} />
                    <Detail label="Invoice triggers" value={engagement.invoice_triggers} />
                    <Detail label="Payment due window" value={engagement.payment_due_window} />
                  </dl>

                  <div className="rounded-lg border border-slate-200 p-3 text-xs leading-relaxed text-slate-500">
                    Invoice and payment activity is not available on this engagement record.
                  </div>
                </section>

                <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                      <h2 className="text-base font-bold text-slate-900">Activity Audit Trail</h2>
                    </div>
                    <span className="text-[11px] text-slate-500">Record history</span>
                  </div>

                  <div className="relative space-y-5 pl-6">
                    <div className="absolute bottom-1 left-[9px] top-1 w-px bg-slate-200" />
                    <div className="relative">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-700 ring-4 ring-white" />
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900">Engagement created</p>
                        <time className="text-[10px] text-slate-500">{formatDate(engagement.created_at)}</time>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        This engagement was added with status {engagement.status.replace(/_/g, " ")}.
                      </p>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-400 ring-4 ring-white" />
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900">Last updated</p>
                        <time className="text-[10px] text-slate-500">{formatDate(engagement.updated_at)}</time>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="mt-1 w-full justify-between text-emerald-800"
                    onClick={() => navigate("/training/engagement-management")}
                  >
                    Return to engagements
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </section>
              </aside>
            </div>
          </>
        )}
      </main>
    </AdminPageShell>
  );
}
