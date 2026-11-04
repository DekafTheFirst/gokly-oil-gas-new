import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  Calendar as CalendarIcon,
  ChevronRight,
  Fingerprint,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
  Verified,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isValid, parseISO, startOfDay, subYears } from "date-fns";
import { createUser, type UserPayload } from "@/lib/users";
import { fetchOrganizations, type OrganizationRecord } from "@/lib/organizations";
import { traineeCreationSchema, type TraineeCreationFormValues } from "@/lib/trainee-creation-validation";

const fieldClassName =
  "h-10 w-full rounded-lg border-0 bg-[#eff4ff] px-3 text-sm text-[#121c2a] outline-none transition-colors placeholder:text-[#6f7a6f] focus-visible:bg-[#dee9fc] focus-visible:ring-2 focus-visible:ring-[#006030]/20";
const selectTriggerClassName =
  "h-10 w-full rounded-lg border-0 bg-[#eff4ff] px-3 text-sm text-[#121c2a] shadow-none focus:ring-2 focus:ring-[#006030]/20";
const SELF_FUNDED_VALUE = "__self_funded__";

function FormField({
  label,
  htmlFor,
  required = false,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-[#3f4940]">
        {label} {required && <span className="text-[#ba1a1a]">*</span>}
      </Label>
      {children}
      {error && <p role="alert" className="text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}

function FormSection({
  letter,
  icon,
  title,
  note,
  children,
}: {
  letter: string;
  icon: React.ReactNode;
  title: string;
  note?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-xl bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#e6eeff] text-[#006030]">{icon}</div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a6400]">Section {letter}</span>
            <h2 className="font-heading text-lg font-semibold leading-tight text-[#121c2a]">{title}</h2>
          </div>
        </div>
        {note}
      </div>
      {children}
    </section>
  );
}

function SelectField({
  id,
  value,
  onChange,
  placeholder,
  options,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={selectTriggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DatePickerField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const parsedDate = value ? parseISO(value) : undefined;
  const selectedDate = parsedDate && isValid(parsedDate) ? parsedDate : undefined;
  const latestEligibleDate = startOfDay(subYears(new Date(), 16));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-label={label}
          aria-haspopup="dialog"
          className="h-10 w-full justify-start rounded-lg border-0 bg-[#eff4ff] px-3 text-left text-sm font-normal text-[#121c2a] shadow-none hover:bg-[#eff4ff] focus-visible:ring-2 focus-visible:ring-[#006030]/20"
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-[#3f4940]" />
          {selectedDate ? format(selectedDate, "PPP") : <span className="text-[#6f7a6f]">Select a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
          disabled={(date) => date > latestEligibleDate}
          initialFocus
        />
        {value && (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default function TraineeCreation() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TraineeCreationFormValues>({
    resolver: zodResolver(traineeCreationSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      first_name: "",
      middle_name: "",
      last_name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
      city: "",
      country: "Nigeria",
      state: "",
      gender: "",
      date_of_birth: "",
      nationality: "",
      nin: "",
      nogic_candidate_number: "",
      ogisp_passport_id: "",
      emergency_contact: "",
      occupation: "",
      corporate_staff_id: "",
      organization_id: SELF_FUNDED_VALUE,
    },
  });
  const firstName = useWatch({ control, name: "first_name" }) ?? "";
  const lastName = useWatch({ control, name: "last_name" }) ?? "";
  const jobTitle = useWatch({ control, name: "occupation" }) ?? "";
  const nogicNumber = useWatch({ control, name: "nogic_candidate_number" }) ?? "";
  const staffId = useWatch({ control, name: "corporate_staff_id" }) ?? "";
  const organizationId = useWatch({ control, name: "organization_id" }) ?? SELF_FUNDED_VALUE;
  const gender = useWatch({ control, name: "gender" }) ?? "";
  const nationality = useWatch({ control, name: "nationality" }) ?? "";
  const dateOfBirth = useWatch({ control, name: "date_of_birth" }) ?? "";

  useEffect(() => {
    let cancelled = false;
    fetchOrganizations()
      .then((items) => {
        if (!cancelled) {
          setOrganizations(items.filter((organization) => organization.status?.toLowerCase() !== "inactive"));
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error("Unable to load organizations", {
            description: error instanceof Error ? error.message : "Organization options are unavailable.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingOrganizations(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedOrganization = organizations.find((organization) => organization.id === organizationId);
  const organizationName = selectedOrganization?.name ?? "Self-Funded / Independent Delegate";

  const onSubmit = async (values: TraineeCreationFormValues) => {
    const payload: UserPayload = {
      first_name: values.first_name.trim(),
      middle_name: values.middle_name.trim() || undefined,
      last_name: values.last_name.trim(),
      email: values.email.trim(),
      password: values.password,
      role: "TRAINEE",
      phone: values.phone.trim(),
      address: values.address.trim() || undefined,
      city: values.city.trim() || undefined,
      country: values.country.trim() || undefined,
      state: values.state.trim() || undefined,
      gender: (gender || undefined) as UserPayload["gender"],
      date_of_birth: dateOfBirth || undefined,
      nationality: nationality || undefined,
      nin: values.nin.trim() || undefined,
      nogic_candidate_number: values.nogic_candidate_number.trim() || undefined,
      ogisp_passport_id: values.ogisp_passport_id.trim() || undefined,
      emergency_contact: values.emergency_contact.trim() || undefined,
      occupation: values.occupation.trim() || undefined,
      corporate_staff_id: values.corporate_staff_id.trim() || undefined,
      organization_id: values.organization_id === SELF_FUNDED_VALUE ? undefined : values.organization_id,
    };

    try {
      await createUser(payload);
      toast.success("Trainee registered successfully");
      navigate("/training/trainees");
    } catch (error) {
      toast.error("Unable to register trainee", {
        description: error instanceof Error ? error.message : "Please review the details and try again.",
      });
    }
  };

  return (
    <AdminPageShell withSidebar searchPlaceholder="Search certification, rig crew, batch...">
      <div className="min-w-0 bg-[#f8f9ff]">
        <div className="relative mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-[#dee9fc]/40 to-transparent" />

          <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[#becabd]/50 pb-5 md:flex-row md:items-end">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#3f4940]">
                <Link to="/training/trainees" className="transition-colors hover:text-[#006030]">Trainees</Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-[#006030]">New Trainee</span>
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-[#121c2a] sm:text-4xl">Register New Trainee</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#3f4940]">
                Create an individual delegate profile, assign regulatory identifiers, and optionally associate with a corporate client organization.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-start md:self-auto">
              <Button type="button" variant="ghost" onClick={() => navigate("/training/trainees")} className="text-[#3f4940]">
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" form="trainee-registration-form" disabled={isSubmitting} className="bg-[#1b7a43] text-white hover:bg-[#006030]">
                <Verified className="h-4 w-4" />
                {isSubmitting ? "Saving…" : "Save Trainee"}
              </Button>
            </div>
          </div>

          <form id="trainee-registration-form" noValidate onSubmit={handleSubmit(onSubmit)} className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
              <FormSection
                letter="A"
                icon={<Users className="h-5 w-5" />}
                title="Personal Information"
                note={<span className="text-xs text-[#3f4940]">Mandatory verification</span>}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField label="First Name" htmlFor="input-first-name" required error={errors.first_name?.message}>
                    <Input id="input-first-name" {...register("first_name")} placeholder="e.g. Tari" autoComplete="given-name" required className={fieldClassName} />
                  </FormField>
                  <FormField label="Last Name" htmlFor="input-last-name" required error={errors.last_name?.message}>
                    <Input id="input-last-name" {...register("last_name")} placeholder="e.g. Briggs" autoComplete="family-name" required className={fieldClassName} />
                  </FormField>
                  <FormField label="Other Name (Tribal / Middle)" htmlFor="input-middle-name">
                    <Input id="input-middle-name" {...register("middle_name")} placeholder="e.g. Emeka" autoComplete="additional-name" className={fieldClassName} />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField label="Gender" htmlFor="input-gender">
                    <SelectField
                      id="input-gender"
                      value={gender}
                      onChange={(value) => setValue("gender", value as TraineeCreationFormValues["gender"], { shouldDirty: true, shouldValidate: true })}
                      placeholder="Select gender"
                      options={[
                        { value: "Male", label: "Male" },
                        { value: "Female", label: "Female" },
                        { value: "Other", label: "Other" },
                      ]}
                    />
                  </FormField>
                  <FormField label="Date of Birth" htmlFor="input-dob">
                    <DatePickerField
                      id="input-dob"
                      label="Date of birth"
                      value={dateOfBirth}
                      onChange={(value) => setValue("date_of_birth", value, { shouldDirty: true, shouldValidate: true })}
                    />
                    <span className="text-xs text-[#6f7a6f]">Trainees must be at least 16 years old.</span>
                    {errors.date_of_birth?.message && <p role="alert" className="text-xs font-medium text-red-700">{errors.date_of_birth.message}</p>}
                  </FormField>
                  <FormField label="Nationality" htmlFor="input-nationality">
                    <SelectField
                      id="input-nationality"
                      value={nationality}
                      onChange={(value) => setValue("nationality", value, { shouldDirty: true, shouldValidate: true })}
                      placeholder="Select nationality"
                      options={[
                        { value: "Nigeria", label: "Nigeria (National)" },
                        { value: "United Kingdom", label: "United Kingdom (Expatriate)" },
                        { value: "Ghana", label: "Ghana" },
                        { value: "United States", label: "United States (Expatriate)" },
                        { value: "Norway", label: "Norway (Expatriate)" },
                        { value: "Other", label: "Other International" },
                      ]}
                    />
                  </FormField>
                </div>
              </FormSection>

              <FormSection
                letter="B"
                icon={<Mail className="h-5 w-5" />}
                title="Contact Information"
                note={<span className="text-xs text-[#3f4940]">Digital Certificates Dispatch</span>}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField label="Primary Email Address" htmlFor="input-email" required error={errors.email?.message}>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f7a6f]" />
                      <Input id="input-email" {...register("email")} type="email" autoComplete="email" placeholder="tari.briggs@offshoreops.com" required className={`${fieldClassName} pl-10`} />
                    </div>
                  </FormField>
                  <FormField label="Direct Mobile / WhatsApp" htmlFor="input-phone" required error={errors.phone?.message}>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f7a6f]" />
                      <Input id="input-phone" {...register("phone")} type="tel" autoComplete="tel" placeholder="+234 803 234 5678" required className={`${fieldClassName} pl-10`} />
                    </div>
                  </FormField>
                </div>
                <FormField label="Residential / Lodging Address" htmlFor="input-address">
                  <Input id="input-address" {...register("address")} autoComplete="street-address" placeholder="Plot 14 Trans-Amadi Industrial Layout, Phase 2" className={fieldClassName} />
                </FormField>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField label="City" htmlFor="input-city">
                    <Input id="input-city" {...register("city")} autoComplete="address-level2" className={fieldClassName} />
                  </FormField>
                  <FormField label="State / Province" htmlFor="input-state">
                    <Input id="input-state" {...register("state")} autoComplete="address-level1" className={fieldClassName} />
                  </FormField>
                  <FormField label="Country" htmlFor="input-country">
                    <Input id="input-country" {...register("country")} autoComplete="country-name" className={fieldClassName} />
                  </FormField>
                </div>
                <FormField label="Initial Portal Password" htmlFor="input-password" required error={errors.password?.message}>
                  <Input id="input-password" {...register("password")} type="password" autoComplete="new-password" minLength={8} required className={fieldClassName} />
                </FormField>
              </FormSection>

              <FormSection
                letter="C"
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Statutory Identification & Yard Clearance"
                note={<span className="inline-flex items-center gap-1.5 rounded-full bg-[#afeec2]/40 px-3 py-1 text-[11px] font-semibold text-[#006030]"><BadgeCheck className="h-3.5 w-3.5" />Regulator Sync</span>}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField label="NIN" htmlFor="input-nin" error={errors.nin?.message}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-[#6f7a6f]">Statutory</span>
                    </div>
                    <Input id="input-nin" {...register("nin")} inputMode="numeric" pattern="[0-9]{11}" maxLength={11} placeholder="11-digit NIN" className={fieldClassName} />
                  </FormField>
                  <FormField label="NOGIC JQS Candidate Number" htmlFor="input-nogic">
                    <span className="text-[10px] font-semibold text-[#006030]">NCDMB Portal</span>
                    <Input id="input-nogic" {...register("nogic_candidate_number")} placeholder="e.g. NOGIC-CAN-98231" className={fieldClassName} />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField label="OGISP Safety Passport Permit ID" htmlFor="input-ogisp">
                    <span className="text-[10px] uppercase tracking-wider text-[#6f7a6f]">DPR / NUPRC</span>
                    <Input id="input-ogisp" {...register("ogisp_passport_id")} placeholder="OGISP-SEC-77402" className={fieldClassName} />
                  </FormField>
                  <FormField label="Emergency Contact (Next of Kin & Phone)" htmlFor="input-emergency">
                    <Input id="input-emergency" {...register("emergency_contact")} placeholder="Sarah Briggs (Spouse) - +234 802 119 4432" className={fieldClassName} />
                  </FormField>
                </div>
              </FormSection>

              <FormSection
                letter="D"
                icon={<Building2 className="h-5 w-5" />}
                title="Corporate Organization & Role"
                note={<span className="text-xs text-[#3f4940]">Billing & Sponsorship</span>}
              >
                <div className="flex items-start gap-3 rounded-lg bg-[#eff4ff] p-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#006030]" />
                  <p className="text-xs leading-relaxed text-[#3f4940]">
                    <strong className="text-[#121c2a]">Important Notice:</strong> Associating a trainee with an organization records their corporate sponsor for billing, OPITO audit logs, and quota reporting, but does not automatically enroll them in an active training batch. Cohort assignment is managed via Batches or Engagements.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField label="Sponsoring Client Organization" htmlFor="input-org">
                    <SelectField
                      id="input-org"
                      value={organizationId}
                      onChange={(value) => setValue("organization_id", value, { shouldDirty: true, shouldValidate: true })}
                      placeholder="Select organization"
                      options={[
                        { value: SELF_FUNDED_VALUE, label: "Self-Funded / Independent Delegate" },
                        ...organizations.map((organization) => ({ value: organization.id, label: organization.name })),
                      ]}
                    />
                    {loadingOrganizations && <span className="text-[11px] text-[#6f7a6f]">Loading organizations…</span>}
                  </FormField>
                  <FormField label="Job Title / Technical Designation" htmlFor="input-role">
                    <Input id="input-role" {...register("occupation")} placeholder="e.g. Senior Well Intervention Specialist" className={fieldClassName} />
                  </FormField>
                </div>
                <FormField label="Corporate Staff / Employee ID (Optional)" htmlFor="input-staff-id">
                  <Input id="input-staff-id" {...register("corporate_staff_id")} placeholder="e.g. SNEP-ENG-4491" className={fieldClassName} />
                </FormField>
              </FormSection>
            </div>

            <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-20 lg:col-span-4">
              <section className="flex flex-col gap-5 rounded-xl bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#121c2a]">
                    <BadgeCheck className="h-4 w-4 text-[#006030]" />
                    Terminal Badge Preview
                  </div>
                  <span className="rounded-full bg-[#afeec2] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#336e4b]">Live Draft</span>
                </div>
                <div className="flex flex-col gap-4 rounded-xl bg-[#eff4ff] p-4">
                  <div className="flex items-center justify-between gap-2 border-b border-[#dee9fc] pb-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Building2 className="h-4 w-4 shrink-0 text-[#006030]" />
                      <span className="truncate text-xs font-bold uppercase tracking-tight text-[#006030]">Gokly Energy Yard</span>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[#8a6400]">Delegate Access</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative grid h-20 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#e6eeff] text-[#6f7a6f] shadow-sm">
                      <UserRound className="h-9 w-9 text-[#becabd]" />
                      <div className="absolute bottom-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-[#006030] text-white">
                        <Fingerprint className="h-3 w-3" />
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#3f4940]">Trainee ID</span>
                        <span className="shrink-0 text-[10px] font-bold text-[#006030]">ASSIGNED ON SAVE</span>
                      </div>
                      <h3 className="truncate text-[15px] font-bold leading-tight text-[#121c2a]">{`${firstName.trim() || "Tari"} ${lastName.trim() || "Briggs"}`}</h3>
                      <p className="truncate text-[11px] leading-snug text-[#3f4940]">{jobTitle.trim() || "Well Specialist"}</p>
                      <div className="mt-1 flex min-w-0 flex-col border-t border-[#dee9fc]/70 pt-1">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-[#3f4940]/70">Organization</span>
                        <span className="truncate text-[11px] font-semibold leading-tight text-[#121c2a]">{organizationName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex min-w-0 flex-col gap-0.5 rounded-lg bg-white p-2 shadow-sm">
                      <span className="truncate text-[9px] font-semibold uppercase tracking-wider text-[#3f4940]">NOGIC JQS</span>
                      <span className="truncate text-[11px] font-semibold text-[#006030]">{nogicNumber.trim() || "Not provided"}</span>
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5 rounded-lg bg-white p-2 shadow-sm">
                      <span className="truncate text-[9px] font-semibold uppercase tracking-wider text-[#3f4940]">Staff ID</span>
                      <span className="truncate text-[11px] font-semibold text-[#121c2a]">{staffId.trim() || "Not provided"}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2 shadow-sm">
                    <div className="flex items-center gap-1 text-[#3f4940]">
                      <Verified className="h-4 w-4 text-[#006030]" />
                      <span className="text-[10px] font-medium">Verification Pending</span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#8a6400]">Clearance Pending</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-lg bg-white p-2 shadow-sm">
                    <div aria-hidden="true" className="flex h-5 w-full items-stretch justify-center gap-0.5 opacity-70">
                      {[1, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1].map((width, index) => (
                        <span key={index} className="bg-[#121c2a]" style={{ width: `${width * 2}px` }} />
                      ))}
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#3f4940]">ID GENERATED ON REGISTRATION</span>
                  </div>
                </div>
              </section>
              <p className="flex items-start gap-2 text-xs leading-relaxed text-[#3f4940]">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#006030]" />
                Statutory identifiers are encrypted at rest. The server must have profile encryption configured to save them.
              </p>
            </aside>
          </form>

          <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-[#becabd]/50 py-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-2 text-xs text-[#3f4940]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#006030]" />
              <span>Standard Gokly OPITO / NOGIC-compliant delegate encryption enabled.</span>
            </div>
            <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
              <Button type="button" variant="ghost" onClick={() => navigate("/training/trainees")} className="text-[#3f4940]">
                Cancel
              </Button>
              <Button type="submit" form="trainee-registration-form" disabled={isSubmitting} className="bg-[#1b7a43] text-white hover:bg-[#006030]">
                <Verified className="h-4 w-4" />
                {isSubmitting ? "Saving…" : "Save & Register Trainee"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminPageShell>
  );
}
