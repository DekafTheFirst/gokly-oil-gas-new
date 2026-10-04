import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, User, Mail, Phone, MapPin, Receipt, Save, Shield, CheckCircle, Building, UserCircle, CreditCard, Building2 as CorporateFare, MailCheck, RefreshCw } from "lucide-react";
import { createOrganization, fetchOrganizationById, updateOrganization } from "@/lib/organizations";
import type { OrganizationRecord } from "@/lib/organizations";
import { toast } from "sonner";

const ORGANIZATION_TYPES = [
  "IOC / E&P Operator",
  "Servicing Contractor",
  "Indigenous E&P",
  "Joint Venture",
  "Downstream / Marketing",
  "Government / Regulator",
];

const INDUSTRIES = [
  "Upstream Oil & Gas",
  "Midstream & Pipeline",
  "Petrochemicals",
  "Offshore Marine & Drilling",
  "Renewable Energy",
];

const STATES = [
  "Lagos State",
  "Rivers State",
  "Delta State",
  "Akwa Ibom State",
  "Bayelsa State",
  "FCT Abuja",
];

const COUNTRIES = [
  "Nigeria",
  "Ghana",
  "Equatorial Guinea",
  "United Kingdom",
  "United States",
];

type FormData = {
  name: string;
  cac_rc_number?: string;
  organization_type?: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  primary_contact_name?: string;
  primary_contact_title?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  invite_to_portal: boolean;
  billing_contact?: string;
  billing_email?: string;
  billing_address?: string;
  tax_id?: string;
  billing_notes?: string;
  sync_billing: boolean;
  status: string;
};

export default function OrganizationCreation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingOrganizationId, setEditingOrganizationId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    cac_rc_number: "",
    organization_type: "IOC / E&P Operator",
    industry: "Upstream Oil & Gas",
    website: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "Lagos State",
    country: "Nigeria",
    primary_contact_name: "",
    primary_contact_title: "",
    primary_contact_email: "",
    primary_contact_phone: "",
    invite_to_portal: true,
    billing_contact: "",
    billing_email: "",
    billing_address: "",
    tax_id: "",
    billing_notes: "",
    sync_billing: true,
    status: "ACTIVE",
  });

  // Load organization data if in edit mode
  useEffect(() => {
    const organizationId = searchParams.get("organizationId");
    if (organizationId) {
      const loadOrganization = async () => {
        try {
          const data = await fetchOrganizationById(organizationId);
          const org = data.organization;

          setIsEditMode(true);
          setEditingOrganizationId(organizationId);

          setFormData({
            name: org.name || "",
            cac_rc_number: org.cac_rc_number || "",
            organization_type: org.organization_type || "",
            industry: org.industry || "",
            website: org.website || "",
            email: org.email || "",
            phone: org.phone || "",
            address: org.address || "",
            city: org.city || "",
            state: org.state || "",
            country: org.country || "",
            primary_contact_name: org.primary_contact || "",
            primary_contact_title: "",
            primary_contact_email: org.email || "",
            primary_contact_phone: org.phone || "",
            invite_to_portal: true,
            billing_contact: org.primary_contact || "",
            billing_email: org.email || "",
            billing_address: org.address || "",
            tax_id: "",
            billing_notes: "",
            sync_billing: true,
            status: org.status || "ACTIVE",
          });

          toast.success("Organization loaded successfully", {
            description: "You can now edit the organization details",
          });
        } catch (err) {
          console.error("Failed to load organization:", err);
          toast.error("Failed to load organization", {
            description: err instanceof Error ? err.message : "Unable to fetch organization details",
          });
          navigate("/admin/organization-management");
        }
      };
      loadOrganization();
    }
  }, [searchParams, navigate]);

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (publish: boolean = false) => {
    if (loading) return;

    if (!formData.name || formData.name.trim().length < 3) {
      toast.error("Organization name is required", {
        description: "Please enter a valid organization name (at least 3 characters)",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        organization_type: formData.organization_type,
        primary_contact: formData.primary_contact_name,
        status: publish ? "ACTIVE" : "DRAFT",
      };

      let organization;
      if (isEditMode && editingOrganizationId) {
        organization = await updateOrganization(editingOrganizationId, payload);
        toast.success("Organization updated successfully", {
          description: "The organization has been saved",
        });
      } else {
        organization = await createOrganization(payload);
        toast.success("Organization created successfully", {
          description: "The organization has been added to the system",
        });
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/admin/organization-management");
      }, 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save organization");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/organization-management");
  };

  const syncBillingFields = (sync: boolean) => {
    if (sync) {
      setFormData((prev) => ({
        ...prev,
        billing_contact: prev.primary_contact_name,
        billing_email: prev.primary_contact_email,
        billing_address: prev.address,
      }));
    }
  };

  /* --------------------------------- success -------------------------------- */

  if (success) {
    return (
      <AdminPageShell withSidebar>
        <div className="flex min-h-[420px] flex-col items-center justify-center">
          <div className="mb-5 rounded-full bg-emerald-600 p-4">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">
            {isEditMode ? "Organization updated" : "Organization created"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">Taking you to the organization list…</p>
        </div>
      </AdminPageShell>
    );
  }

  /* ---------------------------------- page ---------------------------------- */

  return (
    <AdminPageShell withSidebar>
      <div className="page-padding">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/admin/organization-management")}>
            Organizations & Sponsors
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="text-primary font-bold">
            {isEditMode ? "Edit Organization" : "Add / Edit Organization"}
          </span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div className="flex flex-col max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                ORGANIZATION Onboarding
              </span>
              <span className="text-xs text-muted-foreground">Protocol: HSE-REG-v4.2</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {isEditMode ? "Edit Organization" : "Add / Edit Organization"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage corporate details, statutory identifiers, primary liaison, and invoicing configurations.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => handleSubmit(false)} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={() => handleSubmit(true)} disabled={loading} className="gap-2">
              <Building className="h-4 w-4" />
              {loading ? "Saving..." : "Save Organization"}
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form Column (8 of 12 columns) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* SECTION 1: Basic Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                    1
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-slate-900">Basic Information</span>
                    <span className="text-xs text-slate-500">Corporate legal entity, registration identifiers, and operational headquarters</span>
                  </div>
                </div>
                <Building2 className="text-emerald-600 h-6 w-6" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Organization Name */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>Organization Name <span className="text-red-500">*</span></span>
                    <span className="text-xs text-slate-400 font-normal">Required · As shown on official CAC Certificate of Incorporation</span>
                  </Label>
                  <Input
                    placeholder="e.g. Chevron Nigeria Limited"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* CAC / RC Number (Optional) */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>CAC / RC Number</span>
                    <span className="text-xs text-slate-400 font-normal">Optional</span>
                  </Label>
                  <Input
                    placeholder="e.g. RC-341908"
                    value={formData.cac_rc_number}
                    onChange={(e) => updateFormData("cac_rc_number", e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Organization Type (Optional) */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>Organization Type</span>
                    <span className="text-xs text-slate-400 font-normal">Optional</span>
                  </Label>
                  <Select value={formData.organization_type} onValueChange={(value) => updateFormData("organization_type", value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORGANIZATION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Industry / Sector (Optional) */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>Industry / Sector</span>
                    <span className="text-xs text-slate-400 font-normal">Optional</span>
                  </Label>
                  <Select value={formData.industry} onValueChange={(value) => updateFormData("industry", value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Website (Optional) */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>Website</span>
                    <span className="text-xs text-slate-400 font-normal">Optional</span>
                  </Label>
                  <Input
                    placeholder="https://chevron.com"
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateFormData("website", e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Organization Email */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>Organization Email</span>
                    <span className="text-xs text-slate-400 font-normal">General dispatch & correspondence</span>
                  </Label>
                  <Input
                    placeholder="info@chevron.com"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>Phone</span>
                    <span className="text-xs text-slate-400 font-normal">Primary switchboard</span>
                  </Label>
                  <Input
                    placeholder="+234 1 277 0000"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData("phone", e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Address */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>Address</span>
                    <span className="text-xs text-slate-400 font-normal">Street / Operational headquarters address</span>
                  </Label>
                  <Input
                    placeholder="e.g. Chevron Drive, Lekki Peninsula, Lagos"
                    value={formData.address}
                    onChange={(e) => updateFormData("address", e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* City, State, Country (3 Columns) */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-slate-700">City</Label>
                    <Input
                      placeholder="e.g. Lekki / Port Harcourt"
                      value={formData.city}
                      onChange={(e) => updateFormData("city", e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-slate-700">State / Province</Label>
                    <Select value={formData.state} onValueChange={(value) => updateFormData("state", value)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-slate-700">Country</Label>
                    <Select value={formData.country} onValueChange={(value) => updateFormData("country", value)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Primary Contact */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                    2
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-slate-900">Primary Contact</span>
                    <span className="text-xs text-slate-500">Key liaison for training schedules, cohort authorizations, and corporate correspondence</span>
                  </div>
                </div>
                <UserCircle className="text-emerald-600 h-6 w-6" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Person Full Name */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium text-slate-700">Contact Person's Full Name</Label>
                  <Input
                    placeholder="e.g. Mrs. Funke Adeyemi"
                    value={formData.primary_contact_name}
                    onChange={(e) => updateFormData("primary_contact_name", e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Job Title */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium text-slate-700">Job Title</Label>
                  <Input
                    placeholder="e.g. Talent Development & Competency Lead"
                    value={formData.primary_contact_title}
                    onChange={(e) => updateFormData("primary_contact_title", e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium text-slate-700">Email</Label>
                  <Input
                    placeholder="fadeyemi@chevron.com"
                    type="email"
                    value={formData.primary_contact_email}
                    onChange={(e) => updateFormData("primary_contact_email", e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium text-slate-700">Phone</Label>
                  <Input
                    placeholder="+234 803 555 0192"
                    type="tel"
                    value={formData.primary_contact_phone}
                    onChange={(e) => updateFormData("primary_contact_phone", e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Portal Invitation Toggle */}
                <div className="md:col-span-2 p-4 bg-emerald-50 rounded-lg flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <MailCheck className="text-emerald-600 h-6 w-6" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">Invite contact to Gokly Client Portal</span>
                      <span className="text-xs text-slate-500">Automatically send credentials and onboarding access link for scheduling and attendee rosters</span>
                    </div>
                  </div>
                  <Checkbox
                    id="invite-toggle"
                    checked={formData.invite_to_portal}
                    onCheckedChange={(checked) => updateFormData("invite_to_portal", checked === true)}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Optional Billing Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                    3
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-900">Billing & Invoicing Information</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">Optional</span>
                    </div>
                    <span className="text-xs text-slate-500">Tax clearances, billing contact, addresses, and internal accounting protocols</span>
                  </div>
                </div>
                <CreditCard className="text-emerald-600 h-6 w-6" />
              </div>

              {/* Auto-select sync toggle */}
              <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between gap-3 border border-slate-200">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="sync-billing"
                    checked={formData.sync_billing}
                    onCheckedChange={(checked) => {
                      updateFormData("sync_billing", checked === true);
                      syncBillingFields(checked === true);
                    }}
                  />
                  <Label htmlFor="sync-billing" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Same as organization & primary contact details
                  </Label>
                </div>
                <span className="text-xs text-emerald-600 font-medium bg-emerald-100 px-2 py-0.5 rounded">
                  Auto-sync Enabled
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Billing Contact */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>Billing Contact</span>
                    <span className="text-xs text-slate-400 font-normal">Accounts Payable lead</span>
                  </Label>
                  <Input
                    placeholder="e.g. Mrs. Funke Adeyemi"
                    value={formData.billing_contact}
                    onChange={(e) => updateFormData("billing_contact", e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Billing Email */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>Billing Email</span>
                    <span className="text-xs text-slate-400 font-normal">For e-invoicing pipelines</span>
                  </Label>
                  <Input
                    placeholder="e.g. invoicing.nigeria@chevron.com"
                    type="email"
                    value={formData.billing_email}
                    onChange={(e) => updateFormData("billing_email", e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Billing Address */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>Billing Address</span>
                    <span className="text-xs text-slate-400 font-normal">Corporate HQ / Invoicing Office</span>
                  </Label>
                  <Input
                    placeholder="e.g. Chevron Drive, Lekki Peninsula, Lagos"
                    value={formData.billing_address}
                    onChange={(e) => updateFormData("billing_address", e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Tax ID (Optional) */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>Tax ID (TIN / VAT / WHT)</span>
                    <span className="text-xs text-slate-400 font-normal">Optional</span>
                  </Label>
                  <Input
                    placeholder="e.g. TIN-10294819-0001"
                    value={formData.tax_id}
                    onChange={(e) => updateFormData("tax_id", e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Internal Billing Notes */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>Internal Billing Notes</span>
                    <span className="text-xs text-slate-400 font-normal">Internal accounting guidance</span>
                  </Label>
                  <Textarea
                    placeholder="e.g. Net 30/60 post-invoicing terms, PO dispatch requirements, SAP Ariba vendor code..."
                    rows={3}
                    value={formData.billing_notes}
                    onChange={(e) => updateFormData("billing_notes", e.target.value)}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Rail Contextual Live Guidance (4 of 12 columns) */}
          <div className="lg:col-span-4 flex flex-col gap-4 sticky top-20">
            {/* Live Corporate Summary Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Live Portal Preview</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs font-bold">READY</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Building2 className="h-7 w-7" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-bold text-slate-900 truncate">{formData.name || "Organization Legal Name"}</span>
                  <span className="text-xs text-slate-500 truncate">{formData.organization_type || "Organization Type"}</span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Classification</span>
                  <span className="font-semibold text-emerald-600">{formData.organization_type || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">CAC / RC</span>
                  <span className="font-mono text-slate-900">{formData.cac_rc_number || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Location</span>
                  <span className="text-slate-900 truncate max-w-[160px] text-right">
                    {formData.city && formData.country ? `${formData.city}, ${formData.country}` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Billing Setup</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <RefreshCw className="h-4 w-4" />
                    Synced
                  </span>
                </div>
              </div>
              {/* Representative Snippet */}
              {formData.primary_contact_name && (
                <div className="p-4 bg-slate-50 rounded-lg flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 text-xs font-bold">
                    {formData.primary_contact_name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-900 truncate">{formData.primary_contact_name}</span>
                    <span className="text-xs text-slate-500 truncate">{formData.primary_contact_title || "Corporate Liaison"}</span>
                  </div>
                </div>
              )}
              {/* Live Completion Progress */}
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8">
                    <svg className="w-8 h-8 transform -rotate-90">
                      <circle className="text-slate-200 fill-none" cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="3" />
                      <circle className="text-emerald-600 fill-none transition-all duration-500" cx="16" cy="16" r="13" stroke="currentColor" strokeDasharray="81.68" stroke-dashoffset="8.16" strokeWidth="3" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-900">90%</span>
                  </div>
                  <span className="text-xs text-slate-500">Statutory Data Complete</span>
                </div>
                <CheckCircle className="text-emerald-600 h-5 w-5" />
              </div>
            </div>

            {/* Governance Note on Data Privacy Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-600">
                <Shield className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Governance Notice (NDPR)</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                All trainee biometric data, medical fitness fit-to-train slips, and offshore certification transcripts shared through this corporate profile comply strictly with the <strong className="text-slate-900 font-semibold">Nigeria Data Protection Regulation (NDPR) 2023</strong> and Gokly Energy ISO 27001 data governance frameworks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminPageShell>
  );
}
