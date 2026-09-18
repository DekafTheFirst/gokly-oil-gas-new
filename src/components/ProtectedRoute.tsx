import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getHomePathForRole } from "./DashboardRouter";

type ProtectedRouteProps = {
  children: ReactNode;
  redirectTo?: string;
  allowedRoles?: string[];
};

const normalizeRole = (role?: string) => (role || "").toUpperCase();

const roleMatches = (userRole: string | undefined, allowed: string[]) => {
  const normalizedUser = normalizeRole(userRole);
  const normalizedAllowed = allowed.map(normalizeRole);
  // TRAINEE and STUDENT are the same learner role (legacy DB rows use STUDENT)
  if (normalizedUser === "TRAINEE" || normalizedUser === "STUDENT") {
    return normalizedAllowed.includes("TRAINEE") || normalizedAllowed.includes("STUDENT");
  }
  return normalizedAllowed.includes(normalizedUser);
};

const ProtectedRoute = ({ children, redirectTo = "/auth/login", allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth() as { user: { role?: string } | null; loading: boolean };
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles && !roleMatches(user.role, allowedRoles)) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
