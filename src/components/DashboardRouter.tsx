import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const DashboardRouter = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      switch (user.role) {
        case "ADMIN":
          navigate("/training/admin", { replace: true });
          break;
        case "TRAINER":
          navigate("/training/trainer-dashboard", { replace: true });
          break;
        case "STUDENT":
        default:
          navigate("/training/dashboard", { replace: true });
          break;
      }
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