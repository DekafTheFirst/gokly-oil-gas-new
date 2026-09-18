import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const normalizeRole = (role?: string) => (role || "").toUpperCase();

const roleHome = (role?: string) => {
  switch (normalizeRole(role)) {
    case "ADMIN":
      return "/training/admin";
    case "TRAINER":
      return "/training/trainer-dashboard";
    case "TRAINEE":
    case "STUDENT":
    default:
      return "/training/trainee-dashboard";
  }
};

export const getHomePathForRole = roleHome;

const DashboardRouter = () => {
  const { user, loading } = useAuth() as { user: { role?: string } | null; loading: boolean };
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate(roleHome(user.role), { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  return null;
};

export default DashboardRouter;