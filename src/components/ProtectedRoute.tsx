import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

type ProtectedRouteProps = {
  children: ReactNode;
  redirectTo?: string;
  allowedRoles?: string[];
};

const ProtectedRoute = ({ children, redirectTo = "/auth/login", allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
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

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/training" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
