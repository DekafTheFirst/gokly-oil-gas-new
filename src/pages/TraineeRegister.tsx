import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Building2,
  Check,
  Eye,
  EyeOff,
  FileCheck2,
  Globe2,
  HelpCircle,
  LockKeyhole,
  Mail,
  QrCode,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LocationSelect from "@/components/LocationSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import { registerPublicTrainee, resendVerificationEmail } from "@/lib/auth";
import {
  fetchLocationCountries,
  fetchLocationCities,
  fetchLocationStates,
  getLocationStateLabel,
  type LocationCountry,
  type LocationCity,
  type LocationState,
} from "@/lib/location-api";
import {
  publicTraineeRegistrationSchema,
  type PublicTraineeRegistrationValues,
} from "@/lib/public-trainee-registration-validation";

const fieldClassName =
  "h-11 rounded-lg border-[#dce4f2] bg-[#f0f4fc] text-[#17253a] placeholder:text-[#77849a] focus-visible:border-[#237c4b] focus-visible:ring-[#237c4b]/20";

const ErrorText = ({ children }: { children?: string }) =>
  children ? <p className="mt-1 text-xs font-medium text-red-600" role="alert">{children}</p> : null;

const Field = ({
  label,
  htmlFor,
  error,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) => (
  <div className="flex min-w-0 flex-col items-stretch gap-1.5">
    <Label htmlFor={htmlFor} className="block w-fit text-sm font-semibold text-[#25334a]">
      {label}{optional && <span className="ml-1 font-normal text-[#7b8799]">(optional)</span>}
    </Label>
    {children}
    <ErrorText>{error}</ErrorText>
  </div>
);

const SectionHeading = ({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description?: string;
}) => (
  <div className="mb-5 flex items-start gap-3">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e6f2e9] text-sm font-bold text-[#1d7043]">
      {number}
    </span>
    <div>
      <h2 className="font-heading text-lg font-bold text-[#17253a]">{title}</h2>
      {description && <p className="mt-1 text-sm leading-5 text-[#6b778b]">{description}</p>}
    </div>
  </div>
);

const TraineeRegister = () => {
  const [countries, setCountries] = useState<LocationCountry[]>([]);
  const [states, setStates] = useState<LocationState[]>([]);
  const [cities, setCities] = useState<LocationCity[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [countriesError, setCountriesError] = useState("");
  const [statesError, setStatesError] = useState("");
  const [citiesError, setCitiesError] = useState("");
  const [cityRetry, setCityRetry] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationState, setRegistrationState] = useState<"form" | "sent" | "delivery-failed">("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<PublicTraineeRegistrationValues>({
    resolver: zodResolver(publicTraineeRegistrationSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      confirm_password: "",
      first_name: "",
      middle_name: "",
      last_name: "",
      gender: "",
      date_of_birth: "",
      nationality: "",
      phone: "",
      alternate_phone: "",
      address: "",
      city: "",
      country: "NG",
      state: "",
      nin_or_passport: "",
      nogic_candidate_number: "",
      ogisp_passport_id: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      terms_accepted: false,
      statutory_verification_consent: false,
    },
  });

  const values = watch();
  const password = values.password || "";
  const countryCode = values.country || "";
  const fullName = [values.first_name, values.middle_name, values.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  const selectedCountry = useMemo(
    () => countries.find((country) => country.iso2 === countryCode),
    [countries, countryCode],
  );
  const selectedState = useMemo(
    () => states.find((state) => state.iso2 === values.state),
    [states, values.state],
  );
  const locationError = countriesError || statesError;

  useEffect(() => {
    const controller = new AbortController();
    fetchLocationCountries(controller.signal)
      .then((result) => {
        setCountries([...result].sort((a, b) => a.name.localeCompare(b.name)));
        setCountriesError(result.length ? "" : "Country data is unavailable. Try again.");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setCountriesError("Country data could not be loaded. Check your connection and try again.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLocationsLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!countryCode) {
      setStates([]);
      setStatesError("");
      return;
    }

    const controller = new AbortController();
    setStatesLoading(true);
    setStatesError("");
    fetchLocationStates(countryCode, controller.signal)
      .then((result) => {
        setStates([...result].sort((a, b) => a.name.localeCompare(b.name)));
        if (result.length === 0) setStatesError("State data is unavailable for this country.");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setStates([]);
          setStatesError("State data could not be loaded. Try selecting the country again.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setStatesLoading(false);
      });
    return () => controller.abort();
  }, [countryCode]);

  useEffect(() => {
    const stateCode = values.state || "";
    if (!countryCode || statesLoading || (states.length > 0 && !stateCode && !statesError)) {
      setCities([]);
      setCitiesLoading(false);
      setCitiesError("");
      return;
    }

    const controller = new AbortController();
    setCities([]);
    setCitiesLoading(true);
    setCitiesError("");
    fetchLocationCities(countryCode, stateCode || null, controller.signal)
      .then((result) => {
        const distinctCities = new Map(result.map((city) => [city.name, city]));
        const sortedCities = [...distinctCities.values()].sort((a, b) => a.name.localeCompare(b.name));
        setCities(sortedCities);
        if (sortedCities.length === 0) setCitiesError("No cities were returned for this location.");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setCitiesError("City data could not be loaded. Try again.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCitiesLoading(false);
      });
    return () => controller.abort();
  }, [countryCode, values.state, statesLoading, states.length, statesError, cityRetry]);

  const passwordRequirements = [
    { label: "8+ characters", valid: password.length >= 8 },
    { label: "Letter", valid: /[a-z]/i.test(password) },
    { label: "Number", valid: /\d/.test(password) },
    { label: "Special character", valid: /[^A-Za-z0-9]/.test(password) },
  ];
  const strength = passwordRequirements.filter((requirement) => requirement.valid).length;

  const onSubmit = async (formValues: PublicTraineeRegistrationValues) => {
    setSubmissionError("");
    const country = countries.find((option) => option.iso2 === formValues.country);
    const state = states.find((option) => option.iso2 === formValues.state);
    if (!country || !state) {
      setSubmissionError("Select a country and state from the available lists.");
      return;
    }

    const { phone, confirm_password, ...registration } = formValues;
    void confirm_password;

    try {
      const result = await registerPublicTrainee({
        ...registration,
        phone: phone.replace(/\D/g, ""),
        country: country.name,
        state: getLocationStateLabel(countryCode, state),
      });
      setPendingEmail(result.email || formValues.email);
      setRegistrationState("sent");
    } catch (error) {
      if (error instanceof ApiError && error.retryVerification) {
        setPendingEmail(formValues.email);
        setRegistrationState("delivery-failed");
      } else {
        setSubmissionError(error instanceof Error ? error.message : "Unable to submit your registration.");
      }
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    setResending(true);
    try {
      const result = await resendVerificationEmail(pendingEmail);
      toast.success(result.message);
      setRegistrationState("sent");
    } catch (error) {
      toast.error("Unable to resend the confirmation email", {
        description: error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setResending(false);
    }
  };

  const retryLocations = () => {
    setLocationsLoading(true);
    setStatesLoading(Boolean(countryCode));
    setCountriesError("");
    setStatesError("");
    Promise.all([
      fetchLocationCountries(),
      countryCode ? fetchLocationStates(countryCode) : Promise.resolve([]),
    ])
      .then(([result, stateResult]) => {
        setCountries([...result].sort((a, b) => a.name.localeCompare(b.name)));
        setStates([...stateResult].sort((a, b) => a.name.localeCompare(b.name)));
        if (!result.length) setCountriesError("Country data is unavailable. Try again.");
        if (countryCode && !stateResult.length) setStatesError("State data is unavailable. Try again.");
      })
      .catch(() => {
        setCountriesError("Country data could not be loaded. Check your connection and try again.");
        if (countryCode) setStatesError("State data could not be loaded. Try again.");
      })
      .finally(() => {
        setLocationsLoading(false);
        setStatesLoading(false);
      });
  };

  return (
    <main className="min-h-screen bg-[#f7f9ff] px-4 pb-14 pt-8 text-[#17253a] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1240px]">
        <header className="mb-6 flex flex-col gap-4 border-b border-[#e2e8f2] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#287748]">
              Gokly Oil &amp; Gas
            </p>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-[#12223b] sm:text-3xl">
              Public Enrollment Portal
            </h1>
            <p className="mt-1.5 text-sm text-[#66748a]">
              Create your trainee profile and begin your accreditation journey.
            </p>
          </div>
          <p className="text-sm text-[#66748a]">
            Already registered?{" "}
            <Link to="/auth/login" className="font-bold text-[#237746] hover:underline">
              Sign in
            </Link>
          </p>
        </header>

        <div className="mb-7 flex flex-wrap items-center gap-2.5 rounded-xl border border-[#e5ebf5] bg-white px-4 py-3 shadow-sm">
          <span className="mr-1 text-xs font-bold uppercase tracking-wider text-[#7a8698]">Accreditation partners</span>
          {["NCDMB", "OPITO", "OGISP"].map((partner) => (
            <span key={partner} className="inline-flex items-center gap-1.5 rounded-full bg-[#eef5ef] px-3 py-1.5 text-xs font-bold text-[#216b40]">
              <BadgeCheck className="h-3.5 w-3.5" />
              {partner}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(290px,0.85fr)] lg:gap-8">
          <section className="min-w-0 rounded-2xl border border-[#e3e9f2] bg-white p-5 shadow-[0_8px_30px_rgba(27,45,73,0.05)] sm:p-7">
            {registrationState !== "form" ? (
              <div className="py-5 sm:px-4 sm:py-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf5ed] text-[#247748]">
                  {registrationState === "sent"
                    ? <Mail className="h-8 w-8" />
                    : <ShieldCheck className="h-8 w-8" />}
                </div>
                <h2 className="mt-5 text-center font-heading text-2xl font-extrabold text-[#17253a]">
                  {registrationState === "sent" ? "Check your email" : "Registration saved"}
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-6 text-[#66748a]">
                  {registrationState === "sent"
                    ? `If ${pendingEmail} has a pending trainee registration, a confirmation link will be sent to that address. Confirm it before signing in.`
                    : `Your details have been saved, but we couldn't send the confirmation email to ${pendingEmail}. You can request another email below.`}
                </p>
                <div className="mx-auto mt-7 flex max-w-sm flex-col gap-3">
                  <Button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="h-11 bg-[#1f7544] font-bold text-white hover:bg-[#185f37]"
                  >
                    {resending ? "Sending..." : "Resend confirmation email"}
                  </Button>
                  <Button asChild variant="outline" className="h-11 border-[#dce4ef] text-[#25334a]">
                    <Link to="/auth/login">Go to sign in</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-7 flex flex-col gap-2 border-b border-[#edf0f5] pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#247748]">New trainee application</p>
                    <h2 className="mt-1 font-heading text-xl font-extrabold text-[#17253a] sm:text-2xl">Create your trainee account</h2>
                    <p className="mt-1 text-sm text-[#68758a]">Complete each section. Fields marked with * are required.</p>
                  </div>
                  <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#f2f5fb] px-3 py-1.5 text-xs font-semibold text-[#627087]">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    Secure registration
                  </span>
                </div>

                {submissionError && (
                  <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                    {submissionError}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
                  <section>
                    <SectionHeading number="01" title="Account credentials" description="Your email is used for sign-in and account confirmation." />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Email address *" htmlFor="email" error={errors.email?.message}>
                        <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" className={fieldClassName} {...register("email")} />
                      </Field>
                      <div className="hidden sm:block" />
                      <Field label="Password *" htmlFor="password" error={errors.password?.message}>
                        <div className="relative">
                          <Input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Create a password" className={`${fieldClassName} pr-12`} {...register("password")} />
                          <button
                            type="button"
                            onClick={() => setShowPassword((shown) => !shown)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#65738a] hover:text-[#1f7544]"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <div className="mt-2">
                          <div className="mb-1.5 flex gap-1" aria-label={`Password strength: ${strength} of 4`}>
                            {passwordRequirements.map((requirement) => (
                              <span key={requirement.label} className={`h-1 flex-1 rounded-full ${requirement.valid ? "bg-[#2f8a53]" : "bg-[#e2e7ef]"}`} />
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {passwordRequirements.map((requirement) => (
                              <span key={requirement.label} className={`inline-flex items-center gap-1 text-[11px] ${requirement.valid ? "text-[#267547]" : "text-[#8792a2]"}`}>
                                <Check className="h-3 w-3" />{requirement.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Field>
                      <Field label="Confirm password *" htmlFor="confirm_password" error={errors.confirm_password?.message}>
                        <div className="relative">
                          <Input id="confirm_password" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" placeholder="Enter your password again" className={`${fieldClassName} pr-12`} {...register("confirm_password")} />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((shown) => !shown)}
                            aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#65738a] hover:text-[#1f7544]"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </Field>
                    </div>
                  </section>

                  <section>
                    <SectionHeading number="02" title="Personal information" description="Enter your details as they appear on your official documents." />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="First name *" htmlFor="first_name" error={errors.first_name?.message}>
                        <Input id="first_name" autoComplete="given-name" placeholder="First name" className={fieldClassName} {...register("first_name")} />
                      </Field>
                      <Field label="Middle name" htmlFor="middle_name" optional error={errors.middle_name?.message}>
                        <Input id="middle_name" autoComplete="additional-name" placeholder="Middle name" className={fieldClassName} {...register("middle_name")} />
                      </Field>
                      <Field label="Last name *" htmlFor="last_name" error={errors.last_name?.message}>
                        <Input id="last_name" autoComplete="family-name" placeholder="Last name" className={fieldClassName} {...register("last_name")} />
                      </Field>
                      <Field label="Gender *" htmlFor="gender" error={errors.gender?.message}>
                        <Select value={values.gender} onValueChange={(value) => setValue("gender", value as PublicTraineeRegistrationValues["gender"], { shouldValidate: true })}>
                          <SelectTrigger id="gender" className={fieldClassName}><SelectValue placeholder="Select gender" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Date of birth *" htmlFor="date_of_birth" error={errors.date_of_birth?.message}>
                        <Input id="date_of_birth" type="date" autoComplete="bday" className={fieldClassName} {...register("date_of_birth")} />
                      </Field>
                      <Field label="Nationality *" htmlFor="nationality" error={errors.nationality?.message}>
                        <Input id="nationality" autoComplete="country-name" placeholder="e.g. Nigerian" className={fieldClassName} {...register("nationality")} />
                      </Field>
                    </div>
                  </section>

                  <section>
                    <SectionHeading number="03" title="Contact and location" description="Select your country and state from the location database." />
                    {locationError && (
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" role="status">
                        <span>{locationError}</span>
                        <button type="button" onClick={retryLocations} className="font-bold underline" disabled={locationsLoading}>Retry</button>
                      </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Phone number *" htmlFor="phone" error={errors.phone?.message}>
                        <div className="flex">
                          <span className="inline-flex h-11 shrink-0 items-center rounded-l-lg border border-r-0 border-[#dce4f2] bg-[#e7edf7] px-3 text-sm font-semibold text-[#526178]">+234</span>
                          <Input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="8031234567" className={`${fieldClassName} rounded-l-none`} {...register("phone")} />
                        </div>
                      </Field>
                      <Field label="Alternate phone" htmlFor="alternate_phone" optional error={errors.alternate_phone?.message}>
                        <Input id="alternate_phone" type="tel" autoComplete="tel" placeholder="Optional" className={fieldClassName} {...register("alternate_phone")} />
                      </Field>
                      <Field label="Residential address *" htmlFor="address" error={errors.address?.message}>
                        <Input id="address" autoComplete="street-address" placeholder="Street address" className={fieldClassName} {...register("address")} />
                      </Field>
                      <Field label="Country *" htmlFor="country" error={errors.country?.message}>
                        <LocationSelect
                          id="country"
                          value={countryCode}
                          options={countries.map((country) => ({ value: country.iso2, label: country.name }))}
                          placeholder="Select country"
                          searchPlaceholder="Search countries..."
                          loading={locationsLoading}
                          disabled={locationsLoading || countries.length === 0 || Boolean(countriesError)}
                          className={fieldClassName}
                          onChange={(value) => {
                            setValue("country", value, { shouldValidate: true });
                            setValue("state", "", { shouldValidate: false });
                            setValue("city", "", { shouldValidate: false });
                            clearErrors("state");
                            clearErrors("city");
                            setStatesError("");
                          }}
                        />
                      </Field>
                      <Field label="State / Province *" htmlFor="state" error={errors.state?.message}>
                        <LocationSelect
                          id="state"
                          value={values.state}
                          options={states.map((state) => ({
                            value: state.iso2,
                            label: getLocationStateLabel(countryCode, state),
                          }))}
                          placeholder={statesLoading ? "Loading states..." : "Select state or province"}
                          searchPlaceholder="Search states or provinces..."
                          loading={statesLoading}
                          disabled={statesLoading || states.length === 0 || Boolean(statesError)}
                          className={fieldClassName}
                          onChange={(value) => {
                            setValue("state", value, { shouldValidate: true });
                            setValue("city", "", { shouldValidate: false });
                            clearErrors("city");
                          }}
                        />
                      </Field>
                      <Field label="City *" htmlFor="city" error={errors.city?.message}>
                        <LocationSelect
                          id="city"
                          value={values.city}
                          options={cities.map((city) => ({ value: city.name, label: city.name }))}
                          placeholder="Select city"
                          searchPlaceholder="Search cities..."
                          loading={citiesLoading}
                          disabled={!countryCode || citiesLoading || Boolean(citiesError) || (states.length > 0 && !values.state && !statesError)}
                          onChange={(value) => setValue("city", value, { shouldValidate: true })}
                        />
                        {citiesError && (
                          <div className="flex items-center justify-between gap-2 text-xs text-red-700">
                            <span>{citiesError}</span>
                            <button type="button" className="font-bold underline" onClick={() => setCityRetry((retry) => retry + 1)}>
                              Retry
                            </button>
                          </div>
                        )}
                      </Field>
                    </div>
                    <p className="mt-3 text-[11px] text-[#6b778b]">
                      Location data by{" "}
                      <a
                        href="https://github.com/dr5hn/countries-states-cities-database"
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2 hover:text-[#237746]"
                      >
                        Countries States Cities Database
                      </a>{" "}
                      (ODbL 1.0).
                    </p>
                  </section>

                  <section>
                    <SectionHeading number="04" title="Statutory and industry details" description="Your statutory identifiers are encrypted before they are stored." />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="NIN or passport number *" htmlFor="nin_or_passport" error={errors.nin_or_passport?.message}>
                        <Input id="nin_or_passport" autoComplete="off" placeholder="Enter NIN or passport number" className={fieldClassName} {...register("nin_or_passport")} />
                      </Field>
                      <Field label="NOGIC candidate number" htmlFor="nogic_candidate_number" optional error={errors.nogic_candidate_number?.message}>
                        <Input id="nogic_candidate_number" placeholder="If available" className={fieldClassName} {...register("nogic_candidate_number")} />
                      </Field>
                      <Field label="OGISP passport ID" htmlFor="ogisp_passport_id" optional error={errors.ogisp_passport_id?.message}>
                        <Input id="ogisp_passport_id" placeholder="If available" className={fieldClassName} {...register("ogisp_passport_id")} />
                      </Field>
                    </div>
                  </section>

                  <section>
                    <SectionHeading number="05" title="Emergency contact" description="Provide someone we can reach in an emergency." />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Contact name *" htmlFor="emergency_contact_name" error={errors.emergency_contact_name?.message}>
                        <Input id="emergency_contact_name" placeholder="Full name" className={fieldClassName} {...register("emergency_contact_name")} />
                      </Field>
                      <Field label="Contact phone *" htmlFor="emergency_contact_phone" error={errors.emergency_contact_phone?.message}>
                        <Input id="emergency_contact_phone" type="tel" placeholder="Phone number" className={fieldClassName} {...register("emergency_contact_phone")} />
                      </Field>
                    </div>
                  </section>

                  <section className="space-y-4 rounded-xl border border-[#e6ebf3] bg-[#f8faff] p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <input
                        id="terms_accepted"
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0 rounded border-[#bdc8d8] accent-[#247748]"
                        {...register("terms_accepted")}
                      />
                      <div>
                        <Label htmlFor="terms_accepted" className="cursor-pointer text-sm leading-5 text-[#36445a]">
                          I confirm that the information provided is accurate and agree to the{" "}
                          <Link to="/terms" className="font-semibold text-[#237746] underline">Trainee Terms of Service</Link>
                          {" "}and{" "}
                          <Link to="/privacy" className="font-semibold text-[#237746] underline">Privacy Policy</Link>. *
                        </Label>
                        <ErrorText>{errors.terms_accepted?.message}</ErrorText>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 border-t border-[#e4e9f1] pt-4">
                      <input
                        id="statutory_verification_consent"
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0 rounded border-[#bdc8d8] accent-[#247748]"
                        {...register("statutory_verification_consent")}
                      />
                      <div>
                        <Label htmlFor="statutory_verification_consent" className="cursor-pointer text-sm leading-5 text-[#36445a]">
                          I consent to the verification of my NIN or passport and the industry identifiers supplied above. *
                        </Label>
                        <ErrorText>{errors.statutory_verification_consent?.message}</ErrorText>
                      </div>
                    </div>
                  </section>

                  <div className="flex flex-col-reverse gap-3 border-t border-[#edf0f5] pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => toast.info("Drafts are not stored on this device for your privacy.")} className="h-11 border-[#dce4ef] text-[#35445a]">
                        Save Draft
                      </Button>
                      <Button asChild type="button" variant="ghost" className="h-11 text-[#65738a]">
                        <Link to="/">Cancel</Link>
                      </Button>
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="h-11 bg-[#1f7544] px-5 font-bold text-white hover:bg-[#185f37]">
                      {isSubmitting ? "Submitting..." : "Submit registration"}
                      {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </section>

          <aside className="space-y-5 lg:sticky lg:top-8">
            <section className="overflow-hidden rounded-2xl border border-[#dfe8df] bg-white shadow-[0_8px_30px_rgba(27,45,73,0.06)]">
              <div className="flex items-center justify-between bg-[#1f7544] px-5 py-4 text-white">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">Live preview</p>
                  <h2 className="mt-0.5 font-heading text-lg font-bold">Account preview</h2>
                </div>
                <Award className="h-6 w-6 text-[#f4c85a]" />
              </div>
              <div className="p-5">
                <div className="rounded-xl border border-[#e1e8e2] bg-[#fbfdfb] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e9f2eb] text-[#2b7547]">
                      <UserRound className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-[#fff4d8] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#7c5e14]">
                      Pending
                    </span>
                  </div>
                  <p className="mt-4 min-h-6 break-words font-heading text-lg font-extrabold text-[#1b2b40]">
                    {fullName}
                  </p>
                  <p className="mt-1 min-h-5 break-all text-xs text-[#68778a]">
                    {values.email}
                  </p>
                  <div className="my-4 h-px bg-[#e6ebe7]" />
                  <div className="space-y-3 text-xs">
                    {/* <div className="flex items-center justify-between gap-2">
                      <span className="text-[#7a8797]">Trainee ID</span>
                      <span className="font-bold text-[#344359]">Assigned after confirmation</span>
                    </div> */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#7a8797]">Location</span>
                      <span className="text-right font-semibold text-[#344359]">
                        {[values.city, selectedState && getLocationStateLabel(countryCode, selectedState), selectedCountry?.name]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                    {/* <div className="flex items-center justify-between gap-2">
                      <span className="text-[#7a8797]">Accreditation</span>
                      <span className="font-semibold text-[#344359]">Review after registration</span>
                    </div> */}
                  </div>
                  {/* <div className="mt-4 flex items-center justify-between rounded-lg bg-white p-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8390a0]">Badge status</p>
                      <p className="mt-1 text-[11px] font-semibold text-[#344359]">Active after email confirmation</p>
                    </div>
                    <QrCode className="h-9 w-9 text-[#8390a0]" />
                  </div> */}
                </div>
                <p className="mt-3 text-center text-[11px] leading-5 text-[#7b8797]">
                  Your badge preview is private and will be activated after your email is confirmed.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-[#e1e8f1] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4ff] text-[#42628b]">
                  <HelpCircle className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-heading font-bold text-[#1c2a3e]">Need registration help?</h2>
                  <p className="text-xs text-[#778397]">Our team can assist you with the form.</p>
                </div>
              </div>
              <a href="mailto:support@goklyoilandgas.com" className="mt-4 flex items-center gap-2 rounded-lg bg-[#f5f7fb] px-3 py-3 text-sm font-semibold text-[#31435b] hover:bg-[#edf2f8]">
                <Mail className="h-4 w-4 text-[#247748]" />
                support@goklyoilandgas.com
              </a>
              <Link to="/contact" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#237746] hover:underline">
                Contact the registrar <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </section>

            <section className="rounded-xl border border-[#e8ebf1] bg-[#f0f4fc] p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#596980]">
                <ShieldCheck className="h-4 w-4 text-[#267547]" /> Your information is protected
              </p>
              <p className="mt-2 text-xs leading-5 text-[#6c798c]">
                Statutory identifiers are encrypted. Your account stays inactive until you confirm your email address.
              </p>
            </section>
          </aside>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-[#e2e8f2] pt-5 text-xs text-[#788498]">
          <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Gokly Oil &amp; Gas</span>
          <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5" /> Secure enrollment portal</span>
          <span className="inline-flex items-center gap-1.5"><FileCheck2 className="h-3.5 w-3.5" /> Email confirmation required</span>
        </div>
      </div>
    </main>
  );
};

export default TraineeRegister;
