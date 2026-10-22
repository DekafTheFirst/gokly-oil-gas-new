import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, FileText, Users } from "lucide-react";
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

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium whitespace-pre-wrap">{value || "—"}</dd>
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

  return (
    <AdminPageShell withSidebar>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8">
        <Button
          variant="ghost"
          className="-ml-3"
          onClick={() => navigate("/training/engagement-management")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to engagements
        </Button>

        {loading ? (
          <div className="rounded-xl bg-background p-8 text-center text-muted-foreground shadow-sm">
            Loading engagement details...
          </div>
        ) : !engagement ? (
          <div className="rounded-xl bg-background p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold">Engagement not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The engagement may have been removed or you may not have access to it.
            </p>
          </div>
        ) : (
          <>
            <header className="flex flex-col gap-4 rounded-xl bg-background p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Engagement details
                </p>
                <h1 className="text-3xl font-bold tracking-tight">{engagement.name}</h1>
                <p className="font-mono text-sm text-muted-foreground">{engagement.reference_id}</p>
                {engagement.organization_name && (
                  <p className="text-sm text-muted-foreground">{engagement.organization_name}</p>
                )}
              </div>
              <Badge variant="secondary" className="w-fit">
                {engagement.status.replace(/_/g, " ")}
              </Badge>
            </header>

            <section className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-background p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Committed value</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(engagement.total_amount, engagement.currency)}</p>
              </div>
              <div className="rounded-xl bg-background p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Training items</span>
                </div>
                <p className="text-2xl font-bold">{engagement.items?.length ?? engagement.item_count ?? 0}</p>
                <p className="text-xs text-muted-foreground">
                  {engagement.total_trainees ?? engagement.items?.reduce((total, item) => total + item.agreed_quantity, 0) ?? 0} agreed trainees
                </p>
              </div>
              <div className="rounded-xl bg-background p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Delivery period</span>
                </div>
                <p className="text-sm font-semibold">
                  {formatDate(engagement.expected_delivery_start)} – {formatDate(engagement.expected_completion)}
                </p>
              </div>
            </section>

            <section className="space-y-6 rounded-xl bg-background p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-bold">Engagement information</h2>
                <dl className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                  <Detail label="Organization" value={engagement.organization_name} />
                  <Detail label="Primary contact" value={engagement.primary_contact} />
                  <Detail label="Agreement execution date" value={formatDate(engagement.agreement_execution_date)} />
                  <Detail label="Delivery start" value={formatDate(engagement.expected_delivery_start)} />
                  <Detail label="Expected completion" value={formatDate(engagement.expected_completion)} />
                  <Detail label="Description" value={engagement.description} />
                </dl>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-lg font-bold">Training items</h2>
                {!engagement.items?.length ? (
                  <p className="mt-4 text-sm text-muted-foreground">No training items are available.</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Course / service</th>
                          <th className="px-4 py-3 font-semibold">Agreed quantity</th>
                          <th className="px-4 py-3 font-semibold">Unit price</th>
                          <th className="px-4 py-3 font-semibold">Total</th>
                          <th className="px-4 py-3 font-semibold">Curriculum notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {engagement.items.map((item) => (
                          <tr key={item.id || `${item.course_id}-${item.course_name}`}>
                            <td className="px-4 py-3 font-medium">{item.course_name || "—"}</td>
                            <td className="px-4 py-3">{item.agreed_quantity}</td>
                            <td className="px-4 py-3">{formatCurrency(item.unit_price, engagement.currency)}</td>
                            <td className="px-4 py-3 font-semibold">
                              {formatCurrency(item.calculated_total ?? item.agreed_quantity * item.unit_price, engagement.currency)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{item.curriculum_notes || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h2 className="text-lg font-bold">Payment terms</h2>
                <dl className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                  <Detail label="Payment terms" value={engagement.payment_terms} />
                  <Detail label="Invoice triggers" value={engagement.invoice_triggers} />
                  <Detail label="Payment due window" value={engagement.payment_due_window} />
                  <Detail label="Statutory notes" value={engagement.statutory_notes} />
                </dl>
              </div>
            </section>
          </>
        )}
      </main>
    </AdminPageShell>
  );
}
