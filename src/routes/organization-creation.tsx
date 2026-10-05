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
import { COUNTRIES, getStatesForCountry } from "@/lib/location-data";
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
  billing_contact_hidden?: string;
  billing_email_hidden?: string;
  billing_address_hidden?: string;
  logo_url?: string;
  logo_file?: File | null;
};

export default function OrganizationCreation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingOrganizationId, setEditingOrganizationId] = useState<string | null>(null);
  const [states, setStates] = useState<string[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    cac_rc_number: "",
    organization_type: "",
    industry: "",
    website: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
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
    billing_contact_hidden: "",
    billing_email_hidden: "",
    billing_address_hidden: "",
    logo_url: "",
    logo_file: null,
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
            primary_contact_title: org.primary_contact_title || "",
            primary_contact_email: org.email || "",
            primary_contact_phone: org.phone || "",
            invite_to_portal: true,
            billing_contact: "",
            billing_email: "",
            billing_address: "",
            tax_id: "",
            billing_notes: "",
            sync_billing: true,
            status: org.status || "ACTIVE",
            billing_contact_hidden: org.primary_contact || "",
            billing_email_hidden: org.email || "",
            billing_address_hidden: org.address || "",
            logo_url: org.logo_url || "",
            logo_file: null,
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

  // Set states based on selected country and clear state when country changes
  useEffect(() => {
    if (formData.country) {
      const countryStates = getStatesForCountry(formData.country);
      setStates(countryStates);

      // Only clear state if the current state is not valid for the new country
      // This preserves the state when loading from API
      if (formData.state && !countryStates.includes(formData.state)) {
        setFormData((prev) => ({ ...prev, state: "" }));
      }
    } else {
      setStates([]);
    }
  }, [formData.country]);

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

      // Convert logo file to base64 if present
      let logoBase64 = "";
      if (formData.logo_file) {
        logoBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]); // Remove data URL prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(formData.logo_file);
        });
      }

      // If sync_billing is true, override billing fields with organization/primary contact fields
      const finalPayload = {
        ...formData,
        organization_type: formData.organization_type,
        primary_contact: formData.primary_contact_name,
        primary_contact_title: formData.primary_contact_title,
        billing_contact: formData.sync_billing ? formData.primary_contact_name : formData.billing_contact,
        billing_email: formData.sync_billing ? formData.primary_contact_email : formData.billing_email,
        billing_address: formData.sync_billing ? formData.address : formData.billing_address,
        logo_base64: logoBase64,
        logo_url: logoBase64 ? null : formData.logo_url, // Only send logo_url if no new file
        status: publish ? "ACTIVE" : "DRAFT",
      };

      // Remove internal fields from payload
      const { billing_contact_hidden, billing_email_hidden, billing_address_hidden, logo_file, ...payload } = finalPayload;

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
        billing_contact_hidden: prev.primary_contact_name,
        billing_email_hidden: prev.primary_contact_email,
        billing_address_hidden: prev.address,
        billing_contact: prev.primary_contact_name,
        billing_email: prev.primary_contact_email,
        billing_address: prev.address,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        billing_contact: prev.billing_contact_hidden || "",
        billing_email: prev.billing_email_hidden || "",
        billing_address: prev.billing_address_hidden || "",
      }));
    }
  };

  const handleAutoFill = () => {
    setFormData({
      name: "Sample Energy Corporation",
      cac_rc_number: "RC-123456",
      organization_type: "IOC / E&P Operator",
      industry: "Upstream Oil & Gas",
      website: "https://sampleenergy.com",
      email: "contact@sampleenergy.com",
      phone: "+234 801 234 5678",
      address: "123 Energy Plaza, Victoria Island",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      primary_contact_name: "John Doe",
      primary_contact_title: "Operations Manager",
      primary_contact_email: "john.doe@sampleenergy.com",
      primary_contact_phone: "+234 802 345 6789",
      invite_to_portal: true,
      billing_contact: "John Doe",
      billing_email: "billing@sampleenergy.com",
      billing_address: "123 Energy Plaza, Victoria Island, Lagos",
      tax_id: "TAX-789012",
      billing_notes: "Monthly invoicing preferred",
      sync_billing: true,
      status: "ACTIVE",
      billing_contact_hidden: "John Doe",
      billing_email_hidden: "john.doe@sampleenergy.com",
      billing_address_hidden: "123 Energy Plaza, Victoria Island",
      logo_url: "",
      logo_file: null,
    });
    toast.success("Form auto-filled with sample data");
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
            {isEditMode ? "Edit Organization" : "Add Organization"}
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
              {isEditMode ? "Edit Organization" : "Add Organization"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage corporate details, statutory identifiers, primary liaison, and invoicing configurations.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isEditMode && (
              <Button variant="ghost" onClick={handleAutoFill} disabled={loading} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Auto Fill
              </Button>
            )}
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {!isEditMode && (
              <Button variant="outline" onClick={() => handleSubmit(false)} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
            )}
            <Button onClick={() => handleSubmit(true)} disabled={loading} className="gap-2">
              <Building className="h-4 w-4" />
              {loading ? "Saving..." : (isEditMode ? "Save Changes" : "Save Organization")}
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
                    <span className="text-xs text-slate-400 font-normal">Required</span>
                  </Label>
                  <Input
                    placeholder="e.g. Chevron Nigeria Limited"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Company Logo */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>Company Logo</span>
                    <span className="text-xs text-slate-400 font-normal">Optional</span>
                  </Label>
                  <div className="flex items-center gap-4">
                    {formData.logo_url || formData.logo_file ? (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
                        {formData.logo_file ? (
                          <img
                            src={URL.createObjectURL(formData.logo_file)}
                            alt="Logo preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={formData.logo_url}
                            alt="Logo"
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => updateFormData("logo_file", null)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 border-dashed">
                        <span className="text-slate-400 text-xs">No logo</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            updateFormData("logo_file", file);
                          }
                        }}
                        className="h-11"
                      />
                      <p className="text-xs text-slate-400 mt-1">Upload company logo (PNG, JPG, or SVG)</p>
                    </div>
                  </div>
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
                      <SelectValue placeholder="Select organization type" />
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
                      <SelectValue placeholder="Select industry" />
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
                    <span className="text-xs text-slate-400 font-normal">Optional</span>
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
                    <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                      <span>Country</span>
                      <span className="text-xs text-slate-400 font-normal">Optional</span>
                    </Label>
                    <Select value={formData.country} onValueChange={(value) => updateFormData("country", value)}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select country" />
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

                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                      <span>State / Province</span>
                      <span className="text-xs text-slate-400 font-normal">Optional</span>
                    </Label>
                    <Select value={formData.state} onValueChange={(value) => updateFormData("state", value)} disabled={!formData.country}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={states.length > 0 ? "Select state (optional)" : "No states available for this country"} />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                      <span>City</span>
                      <span className="text-xs text-slate-400 font-normal">Optional</span>
                    </Label>
                    <Input
                      placeholder="e.g. Lekki / Port Harcourt"
                      value={formData.city}
                      onChange={(e) => updateFormData("city", e.target.value)}
                      className="h-11"
                    />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {!formData.sync_billing && (
                  <>
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
                  </>
                )}

                {/* Tax ID (Optional) */}
                <div className="flex flex-col gap-2 md:col-span-2 ">
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
                {(formData.logo_url || formData.logo_file) ? (
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                    {formData.logo_file ? (
                      <img
                        src={URL.createObjectURL(formData.logo_file)}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={formData.logo_url}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <Building2 className="h-7 w-7" />
                  </div>
                )}
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
                    {formData.city && formData.country
                      ? `${formData.city}${formData.state ? `, ${formData.state}` : ""}, ${formData.country}`
                      : "—"}
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
