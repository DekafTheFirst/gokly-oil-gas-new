import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

const traineeRegisterSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters."),
  middle_name: z.string().optional(),
  last_name: z.string().min(2, "Last name must be at least 2 characters."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

type TraineeRegisterFormValues = z.infer<typeof traineeRegisterSchema>;

const TraineeRegister = () => {
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();
  const { register: registerAccount } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TraineeRegisterFormValues>({
    resolver: zodResolver(traineeRegisterSchema),
  });

  const onSubmit = async (values: TraineeRegisterFormValues) => {
    try {
      const payload = await registerAccount({ ...values, role: "TRAINEE" });
      // Trainees always go to the main dashboard
      navigate("/training/dashboard");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unable to register.");
    }
  };

  return (
    <main className="min-h-screen bg-background py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-md border">
          <CardHeader>
            <CardTitle>Register as a Trainee</CardTitle>
            <CardDescription>Create your trainee account to start your learning journey.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input id="first_name" type="text" placeholder="Enter your first name" {...register("first_name")} />
                {errors.first_name ? <p className="text-sm text-destructive">{errors.first_name.message}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="middle_name">Middle Name (Optional)</Label>
                <Input id="middle_name" type="text" placeholder="Enter your middle name" {...register("middle_name")} />
                {errors.middle_name ? <p className="text-sm text-destructive">{errors.middle_name.message}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" type="text" placeholder="Enter your last name" {...register("last_name")} />
                {errors.last_name ? <p className="text-sm text-destructive">{errors.last_name.message}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
                {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Create a password" {...register("password")} />
                {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input id="phone" type="tel" placeholder="Enter your phone number" {...register("phone")} />
                {errors.phone ? <p className="text-sm text-destructive">{errors.phone.message}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input id="address" type="text" placeholder="Enter your address" {...register("address")} />
                {errors.address ? <p className="text-sm text-destructive">{errors.address.message}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City (Optional)</Label>
                <Input id="city" type="text" placeholder="Enter your city" {...register("city")} />
                {errors.city ? <p className="text-sm text-destructive">{errors.city.message}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">Country (Optional)</Label>
                <Input id="country" type="text" placeholder="Enter your country" {...register("country")} />
                {errors.country ? <p className="text-sm text-destructive">{errors.country.message}</p> : null}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-0">
            <Button type="submit" className="w-full" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create Trainee Account"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account? <Link to="/auth/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
};

export default TraineeRegister;
