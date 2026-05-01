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

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const AuthRegister = () => {
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();
  const { register: registerAccount } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await registerAccount(values);
      navigate("/");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unable to register.");
    }
  };

  return (
    <main className="min-h-screen bg-background py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-md border">
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Register and start using the auth system immediately.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" type="text" placeholder="Enter your name" {...register("name")} />
                {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
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
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-0">
            <Button type="submit" className="w-full" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
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

export default AuthRegister;
