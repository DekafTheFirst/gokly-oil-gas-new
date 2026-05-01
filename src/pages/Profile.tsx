import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

const Profile = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth/login");
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>;
  }

  return (
    <main className="min-h-screen bg-background py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-lg border">
          <CardHeader>
            <CardTitle>Welcome back, {user.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="rounded-lg border bg-muted p-4">
              <p className="text-sm text-muted-foreground">Here is your current account information.</p>
              <div className="mt-4 space-y-2 text-sm">
                <div>
                  <strong className="block text-foreground">Name</strong>
                  <span className="text-muted-foreground">{user.name}</span>
                </div>
                <div>
                  <strong className="block text-foreground">Email</strong>
                  <span className="text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" onClick={() => logout()}>
              Sign out
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
};

export default Profile;
