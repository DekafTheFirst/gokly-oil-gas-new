import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  EyeOff,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const profileSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters."),
  middle_name: z.string().optional(),
  last_name: z.string().min(2, "Last name must be at least 2 characters."),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters."),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const fieldClassName =
  "h-11 rounded-lg border-[#d9e3f6] bg-[#f8f9ff] text-[#121c2a] focus-visible:ring-[#006030]/20";

const ProfileField = ({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="flex min-w-0 flex-col gap-2">
    <Label htmlFor={htmlFor} className="text-xs font-semibold text-[#3f4940]">{label}</Label>
    {children}
    {error && <p className="text-xs font-medium text-red-600" role="alert">{error}</p>}
  </div>
);

const Detail = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | null;
  icon?: typeof UserRound;
}) => (
  <div className="min-w-0">
    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6f7a6f]">{label}</p>
    <div className="mt-1 flex min-w-0 items-center gap-2 text-sm font-medium text-[#121c2a]">
      {Icon && <Icon className="h-4 w-4 shrink-0 text-[#006030]" aria-hidden="true" />}
      <span className="break-words">{value || <span className="font-normal text-[#89938b]">Not provided</span>}</span>
    </div>
  </div>
);

const PasswordField = ({
  id,
  label,
  visible,
  onToggle,
  error,
  registration,
}: {
  id: "currentPassword" | "newPassword" | "confirmPassword";
  label: string;
  visible: boolean;
  onToggle: () => void;
  error?: string;
  registration: ReturnType<ReturnType<typeof useForm<PasswordFormValues>>["register"]>;
}) => (
  <ProfileField label={label} htmlFor={id} error={error}>
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={id === "currentPassword" ? "current-password" : "new-password"}
        className={`${fieldClassName} pr-12`}
        {...registration}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#6f7a6f] transition-colors hover:text-[#006030]"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  </ProfileField>
);

const Profile = () => {
  const { user, loading, logout, updateProfile, changePassword, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;
  const [activeTab, setActiveTab] = useState("profile");
  const [editing, setEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileRefreshing, setProfileRefreshing] = useState(true);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
    reset: resetProfile,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || "",
      middle_name: user?.middle_name || "",
      last_name: user?.last_name || "",
      phone: user?.phone || "",
      address: user?.address || "",
      city: user?.city || "",
      country: user?.country || "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    reset: resetPassword,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (user) {
      resetProfile({
        first_name: user.first_name || "",
        middle_name: user.middle_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        country: user.country || "",
      });
    }
  }, [user, resetProfile]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth/login");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (loading || !userId) return;

    let active = true;
    setProfileRefreshing(true);
    refreshProfile()
      .catch((error) => {
        if (active) {
          toast.error("Unable to refresh your profile", {
            description: error instanceof Error ? error.message : "Please try again.",
          });
        }
      })
      .finally(() => {
        if (active) setProfileRefreshing(false);
      });

    return () => {
      active = false;
    };
  }, [loading, userId, refreshProfile]);

  const profileName = useMemo(
    () => [user?.first_name, user?.middle_name, user?.last_name].filter(Boolean).join(" "),
    [user?.first_name, user?.middle_name, user?.last_name],
  );
  const initials = profileName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || user?.email?.[0]?.toUpperCase() || "?";
  const isActive = user?.is_active !== false;
  const roleLabel = String(user?.role || "TRAINEE").toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
  const createdDate = user?.created_at ? new Date(user.created_at) : null;
  const createdLabel = createdDate && !Number.isNaN(createdDate.getTime())
    ? new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(createdDate)
    : "Not available";
  const profileFields = [user?.first_name, user?.last_name, user?.phone, user?.address, user?.city, user?.country];
  const completedFields = profileFields.filter((value) => Boolean(String(value || "").trim())).length;

  if (loading || profileRefreshing || !user) {
    return (
      <AdminPageShell withSidebar>
        <div className="flex min-h-[60vh] items-center justify-center bg-[#f8f9ff]">
          <p className="text-sm font-medium text-[#3f4940]">Loading profile...</p>
        </div>
      </AdminPageShell>
    );
  }

  const onProfileSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile(values);
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile", {
        description: error instanceof Error ? error.message : "Unable to update profile",
      });
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Password changed successfully");
      resetPassword();
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      toast.error("Failed to change password", {
        description: error instanceof Error ? error.message : "Unable to change password",
      });
    }
  };

  return (
    <AdminPageShell withSidebar>
      <div className="min-h-full bg-[#f8f9ff] pb-16 text-[#121c2a]">
      <div className="page-padding mx-auto flex w-full max-w-[1280px] flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-[#3f4940]">
            <span>Account</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span className="font-semibold text-[#121c2a]">My Profile</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#3f4940]">
            <Building2 className="h-4 w-4 text-[#006030]" aria-hidden="true" />
            Gokly Compliance &amp; Training
          </div>
        </div>

        <section className="relative overflow-hidden rounded-xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div className="relative h-28 overflow-hidden bg-gradient-to-r from-[#006030] via-[#14733d] to-[#1b7a43]">
            <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute -right-8 -top-12 h-64 w-64 rounded-full bg-[#fcbc22]/20 blur-2xl" />
            <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md sm:right-6">
              {isActive ? <BadgeCheck className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              {isActive ? "Account active" : "Account inactive"}
            </div>
          </div>

          <div className="relative flex flex-col gap-5 px-4 pb-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="-mt-5 flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-end">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-[#eff4ff] text-2xl font-bold text-[#006030] shadow-lg ring-4 ring-white sm:h-28 sm:w-28">
                {initials}
              </div>
              <div className="flex min-w-0 flex-col gap-2 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="break-words text-2xl font-bold tracking-tight text-[#121c2a] sm:text-3xl">
                    {profileName || user.email}
                  </h1>
                  {isActive && <Check className="h-5 w-5 text-[#006030]" aria-label="Active account" />}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#3f4940]">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-[#006030]" aria-hidden="true" />
                    <span className="break-all">{user.email}</span>
                  </span>
                  {user.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-[#006030]" aria-hidden="true" />
                      {user.phone}
                    </span>
                  )}
                  {user.city && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-[#006030]" aria-hidden="true" />
                      {[user.city, user.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button
                type="button"
                variant="outline"
                className="border-0 bg-[#eff4ff] text-[#121c2a] hover:bg-[#dee9fc]"
                onClick={() => {
                  setActiveTab("profile");
                  setEditing((current) => !current);
                }}
              >
                <Edit3 className="mr-2 h-4 w-4" aria-hidden="true" />
                {editing ? "Cancel editing" : "Edit profile"}
              </Button>
              <Button
                type="button"
                className="bg-[#006030] text-white hover:bg-[#1b7a43]"
                onClick={() => navigate("/training/home")}
              >
                Training dashboard
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </section>

        <section aria-label="Account overview" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Account role", value: roleLabel, hint: "Access level", icon: UserRound },
            { label: "Account status", value: isActive ? "Active" : "Inactive", hint: "Current access", icon: ShieldCheck },
            { label: "Member since", value: createdLabel, hint: "Account creation date", icon: CalendarDays },
            { label: "Profile details", value: `${completedFields} of ${profileFields.length}`, hint: "Key details provided", icon: Clock3 },
          ].map(({ label, value, hint, icon: Icon }) => (
            <div key={label} className="flex min-h-32 flex-col justify-between rounded-xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-[#3f4940]">{label}</span>
                <Icon className="h-5 w-5 text-[#006030]" aria-hidden="true" />
              </div>
              <div className="mt-4">
                <p className="break-words text-xl font-bold leading-tight text-[#121c2a]">{value}</p>
                <p className="mt-1 text-xs text-[#6f7a6f]">{hint}</p>
              </div>
            </div>
          ))}
        </section>

        <Tabs
          value={activeTab}
          onValueChange={(tab) => {
            setActiveTab(tab);
            if (tab !== "profile") setEditing(false);
          }}
          className="w-full"
        >
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-white p-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <TabsTrigger
              value="profile"
              className="gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-[#3f4940] data-[state=active]:bg-[#006030] data-[state=active]:text-white"
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-[#3f4940] data-[state=active]:bg-[#006030] data-[state=active]:text-white"
            >
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="flex flex-col gap-4 lg:col-span-8">
                <section className="flex flex-col gap-5 rounded-xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eff4ff] pb-4">
                    <div className="flex items-center gap-2">
                      <UserRound className="h-5 w-5 text-[#006030]" aria-hidden="true" />
                      <h2 className="text-base font-semibold text-[#121c2a]">Personal &amp; account details</h2>
                    </div>
                    <span className="rounded-full bg-[#eff4ff] px-3 py-1 text-xs font-medium text-[#3f4940]">
                      {roleLabel}
                    </span>
                  </div>

                  {!editing ? (
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 md:grid-cols-3">
                      <Detail label="First name" value={user.first_name} />
                      <Detail label="Middle name" value={user.middle_name} />
                      <Detail label="Last name" value={user.last_name} />
                      <Detail label="Email address" value={user.email} icon={Mail} />
                      <Detail label="Account role" value={roleLabel} icon={ShieldCheck} />
                      <Detail label="Member since" value={createdLabel} icon={CalendarDays} />
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="flex flex-col gap-5">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <ProfileField label="First name" htmlFor="first_name" error={profileErrors.first_name?.message}>
                          <Input id="first_name" autoComplete="given-name" className={fieldClassName} {...registerProfile("first_name")} />
                        </ProfileField>
                        <ProfileField label="Middle name" htmlFor="middle_name" error={profileErrors.middle_name?.message}>
                          <Input id="middle_name" autoComplete="additional-name" className={fieldClassName} {...registerProfile("middle_name")} />
                        </ProfileField>
                        <ProfileField label="Last name" htmlFor="last_name" error={profileErrors.last_name?.message}>
                          <Input id="last_name" autoComplete="family-name" className={fieldClassName} {...registerProfile("last_name")} />
                        </ProfileField>
                        <ProfileField label="Phone number" htmlFor="phone" error={profileErrors.phone?.message}>
                          <Input id="phone" type="tel" autoComplete="tel" className={fieldClassName} {...registerProfile("phone")} />
                        </ProfileField>
                        <ProfileField label="Street address" htmlFor="address" error={profileErrors.address?.message}>
                          <Input id="address" autoComplete="street-address" className={fieldClassName} {...registerProfile("address")} />
                        </ProfileField>
                        <ProfileField label="City" htmlFor="city" error={profileErrors.city?.message}>
                          <Input id="city" autoComplete="address-level2" className={fieldClassName} {...registerProfile("city")} />
                        </ProfileField>
                        <ProfileField label="Country" htmlFor="country" error={profileErrors.country?.message}>
                          <Input id="country" autoComplete="country-name" className={fieldClassName} {...registerProfile("country")} />
                        </ProfileField>
                        <ProfileField label="Email address" htmlFor="profile_email">
                          <Input id="profile_email" value={user.email} disabled className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-70`} />
                        </ProfileField>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2 border-t border-[#eff4ff] pt-4">
                        <Button type="button" variant="outline" onClick={() => {
                          resetProfile();
                          setEditing(false);
                        }}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isProfileSubmitting} className="bg-[#006030] text-white hover:bg-[#1b7a43]">
                          {isProfileSubmitting ? "Saving..." : "Save changes"}
                        </Button>
                      </div>
                    </form>
                  )}
                </section>

                <section className="flex flex-col gap-5 rounded-xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sm:p-6">
                  <div className="flex items-center gap-2 border-b border-[#eff4ff] pb-4">
                    <MapPin className="h-5 w-5 text-[#006030]" aria-hidden="true" />
                    <h2 className="text-base font-semibold text-[#121c2a]">Contact &amp; location</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                    <Detail label="Phone number" value={user.phone} icon={Phone} />
                    <Detail label="Email address" value={user.email} icon={Mail} />
                    <Detail label="Street address" value={user.address} />
                    <Detail label="City" value={user.city} />
                    <Detail label="Country" value={user.country} />
                  </div>
                </section>
              </div>

              <aside className="flex flex-col gap-4 lg:col-span-4">
                <section className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sm:p-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#006030]" aria-hidden="true" />
                    <h2 className="text-base font-semibold text-[#121c2a]">Account access</h2>
                  </div>
                  <div className="rounded-lg bg-[#eff4ff] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f7a6f]">Email address</p>
                    <p className="mt-1 break-all text-sm font-semibold text-[#121c2a]">{user.email}</p>
                    <p className="mt-2 text-xs leading-5 text-[#3f4940]">Your email is used to sign in and receive account updates.</p>
                  </div>
                  <div className="rounded-lg bg-[#eff4ff] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f7a6f]">Account status</p>
                    <p className={`mt-1 inline-flex items-center gap-2 text-sm font-semibold ${isActive ? "text-[#006030]" : "text-[#ba1a1a]"}`}>
                      <span className={`h-2 w-2 rounded-full ${isActive ? "bg-[#006030]" : "bg-[#ba1a1a]"}`} />
                      {isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-start border-[#d9e3f6] text-[#3f4940] hover:bg-[#eff4ff]"
                    onClick={() => setActiveTab("security")}
                  >
                    <LockKeyhole className="mr-2 h-4 w-4 text-[#006030]" aria-hidden="true" />
                    Manage password
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-start border-[#d9e3f6] text-[#3f4940] hover:bg-[#eff4ff]"
                    onClick={() => {
                      logout();
                      navigate("/auth/login");
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    Sign out
                  </Button>
                </section>
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-4">
            <section className="mx-auto flex w-full max-w-3xl flex-col gap-5 rounded-xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sm:p-6">
              <div className="border-b border-[#eff4ff] pb-4">
                <div className="flex items-center gap-2">
                  <LockKeyhole className="h-5 w-5 text-[#006030]" aria-hidden="true" />
                  <h2 className="text-base font-semibold text-[#121c2a]">Password &amp; security</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#3f4940]">Choose a strong password that you do not use for other accounts.</p>
              </div>
              <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="flex flex-col gap-4">
                <PasswordField
                  id="currentPassword"
                  label="Current password"
                  visible={showCurrentPassword}
                  onToggle={() => setShowCurrentPassword((visible) => !visible)}
                  error={passwordErrors.currentPassword?.message}
                  registration={registerPassword("currentPassword")}
                />
                <PasswordField
                  id="newPassword"
                  label="New password"
                  visible={showNewPassword}
                  onToggle={() => setShowNewPassword((visible) => !visible)}
                  error={passwordErrors.newPassword?.message}
                  registration={registerPassword("newPassword")}
                />
                <PasswordField
                  id="confirmPassword"
                  label="Confirm new password"
                  visible={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((visible) => !visible)}
                  error={passwordErrors.confirmPassword?.message}
                  registration={registerPassword("confirmPassword")}
                />
                <div className="flex justify-end border-t border-[#eff4ff] pt-4">
                  <Button type="submit" disabled={isPasswordSubmitting} className="bg-[#006030] text-white hover:bg-[#1b7a43]">
                    {isPasswordSubmitting ? "Updating..." : "Update password"}
                  </Button>
                </div>
              </form>
            </section>
        </TabsContent>
        </Tabs>
        </div>
        </div>
    </AdminPageShell>
  );
};

export default Profile;
