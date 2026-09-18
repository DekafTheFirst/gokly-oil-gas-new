import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";

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

const Profile = () => {
  const { user, loading, logout, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

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
    if (!loading && !user) {
      navigate("/auth/login");
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>;
  }

  const onProfileSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile(values);
      setProfileMessage("Profile updated successfully!");
      setTimeout(() => setProfileMessage(""), 3000);
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Failed to update profile.");
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setPasswordMessage("Password changed successfully!");
      resetPassword();
      setTimeout(() => setPasswordMessage(""), 3000);
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : "Failed to change password.");
    }
  };

  return (
    <main className="min-h-screen bg-background py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-2xl border">
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>Manage your account settings and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile Information</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-4 mt-6">
                {profileMessage && (
                  <div className={`p-3 rounded-md text-sm ${profileMessage.includes("success") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                    {profileMessage}
                  </div>
                )}
                
                <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input id="first_name" {...registerProfile("first_name")} />
                      {profileErrors.first_name && <p className="text-sm text-destructive">{profileErrors.first_name.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="middle_name">Middle Name</Label>
                      <Input id="middle_name" {...registerProfile("middle_name")} />
                      {profileErrors.middle_name && <p className="text-sm text-destructive">{profileErrors.middle_name.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input id="last_name" {...registerProfile("last_name")} />
                      {profileErrors.last_name && <p className="text-sm text-destructive">{profileErrors.last_name.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" type="tel" {...registerProfile("phone")} />
                      {profileErrors.phone && <p className="text-sm text-destructive">{profileErrors.phone.message}</p>}
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" {...registerProfile("address")} />
                      {profileErrors.address && <p className="text-sm text-destructive">{profileErrors.address.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" {...registerProfile("city")} />
                      {profileErrors.city && <p className="text-sm text-destructive">{profileErrors.city.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" {...registerProfile("country")} />
                      {profileErrors.country && <p className="text-sm text-destructive">{profileErrors.country.message}</p>}
                    </div>
                  </div>
                  
                  <div className="rounded-lg border bg-muted p-4 space-y-2">
                    <div>
                      <strong className="block text-foreground text-sm">Email</strong>
                      <span className="text-muted-foreground text-sm">{user.email}</span>
                    </div>
                    <div>
                      <strong className="block text-foreground text-sm">Role</strong>
                      <span className="text-muted-foreground text-sm capitalize">{user.role}</span>
                    </div>
                    <div>
                      <strong className="block text-foreground text-sm">Account Status</strong>
                      <span className={`text-sm ${user.is_active ? "text-green-600" : "text-red-600"}`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <Button type="submit" disabled={isProfileSubmitting}>
                    {isProfileSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="security" className="space-y-4 mt-6">
                {passwordMessage && (
                  <div className={`p-3 rounded-md text-sm ${passwordMessage.includes("success") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                    {passwordMessage}
                  </div>
                )}
                
                <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" {...registerPassword("currentPassword")} />
                    {passwordErrors.currentPassword && <p className="text-sm text-destructive">{passwordErrors.currentPassword.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" {...registerPassword("newPassword")} />
                    {passwordErrors.newPassword && <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" {...registerPassword("confirmPassword")} />
                    {passwordErrors.confirmPassword && <p className="text-sm text-destructive">{passwordErrors.confirmPassword.message}</p>}
                  </div>

                  <Button type="submit" disabled={isPasswordSubmitting}>
                    {isPasswordSubmitting ? "Changing..." : "Change Password"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button variant="destructive" onClick={() => logout()}>
              Sign out
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
};

export default Profile;
