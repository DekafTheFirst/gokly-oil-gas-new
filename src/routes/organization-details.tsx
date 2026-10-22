import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, ExternalLink, Mail, MapPin, Pencil, Receipt } from "lucide-react";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchOrganizationById, type OrganizationRecord } from "@/lib/organizations";
import { toast } from "sonner";

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}

export default function OrganizationDetails() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<OrganizationRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      toast.error("Organization ID is missing");
      return;
    }

    let cancelled = false;
    const loadOrganization = async () => {
      try {
        setLoading(true);
        const response = await fetchOrganizationById(organizationId);
        if (!cancelled) setOrganization(response.organization);
      } catch (error) {
        console.error("Failed to load organization:", error);
        if (!cancelled) toast.error("Failed to load organization details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadOrganization();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const editPath = organizationId
    ? `/training/organization-management/create-details?organizationId=${encodeURIComponent(organizationId)}`
    : "/training/organization-management";
  const location = organization
    ? [organization.city, organization.state, organization.country].filter(Boolean).join(", ")
    : "";

  return (
    <AdminPageShell withSidebar>
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <Button
          variant="ghost"
          className="-ml-3"
          onClick={() => navigate("/training/organization-management")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to organizations
        </Button>

        {loading ? (
          <div className="rounded-xl bg-background p-8 text-center text-muted-foreground shadow-sm">
            Loading organization details...
          </div>
        ) : !organization ? (
          <section className="rounded-xl bg-background p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold">Organization not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The organization may have been removed or you may not have access to it.
            </p>
          </section>
        ) : (
          <>
            <header className="flex flex-col gap-5 rounded-xl bg-background p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                {organization.logo_url ? (
                  <img
                    src={organization.logo_url}
                    alt={`${organization.name} logo`}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-8 w-8" />
                  </div>
                )}
                <div className="min-w-0 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Organization details
                  </p>
                  <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">{organization.name}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    {organization.organization_type && (
                      <Badge variant="secondary">{organization.organization_type}</Badge>
                    )}
                    <Badge variant={organization.status === "ACTIVE" ? "default" : "outline"}>
                      {organization.status || "Status unavailable"}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button className="shrink-0" onClick={() => navigate(editPath)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit organization
              </Button>
            </header>

            <section className="grid gap-6 lg:grid-cols-2">
              <article className="space-y-5 rounded-xl bg-background p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">Organization profile</h2>
                </div>
                <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  <Detail label="Organization name" value={organization.name} />
                  <Detail label="Organization type" value={organization.organization_type} />
                  <Detail label="Industry" value={organization.industry} />
                  <Detail label="CAC / RC number" value={organization.cac_rc_number} />
                  <Detail label="Website" value={organization.website} />
                  <Detail label="Engagements" value={organization.number_of_engagements} />
                </dl>
              </article>

              <article className="space-y-5 rounded-xl bg-background p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">Primary contact</h2>
                </div>
                <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  <Detail label="Contact name" value={organization.primary_contact} />
                  <Detail label="Contact title" value={organization.primary_contact_title} />
                  <Detail label="Email" value={organization.email} />
                  <Detail label="Phone" value={organization.phone} />
                </dl>
              </article>

              <article className="space-y-5 rounded-xl bg-background p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">Address</h2>
                </div>
                <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  <Detail label="Street address" value={organization.address} />
                  <Detail label="City / region" value={location} />
                </dl>
              </article>

              <article className="space-y-5 rounded-xl bg-background p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">Record information</h2>
                </div>
                <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  <Detail label="Status" value={organization.status} />
                  <Detail label="Created" value={organization.created_at ? new Date(organization.created_at).toLocaleDateString() : undefined} />
                  <Detail label="Last updated" value={organization.updated_at ? new Date(organization.updated_at).toLocaleDateString() : undefined} />
                </dl>
              </article>
            </section>

            {organization.website && (
              <a
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                href={organization.website.startsWith("http") ? organization.website : `https://${organization.website}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Visit organization website
              </a>
            )}
          </>
        )}
      </main>
    </AdminPageShell>
  );
}
