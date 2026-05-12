import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import Feedbacks from "./pages/Feedbacks";
import AuthLogin from "./pages/AuthLogin";
import AuthRegister from "./pages/AuthRegister";
import Profile from "./pages/Profile";
import DashboardRouter from "./components/DashboardRouter";
import NotFound from "./pages/NotFound";
import TrainingHome from "./routes/index";
import TrainingCourses from "./routes/courses";
import TrainingDashboard from "./routes/dashboard";
import TrainingVerify from "./routes/verify";
import TrainingAdmin from "./routes/admin";
import TrainingTrainer from "./routes/trainer";
import TrainingBulkCertificateIssuance from "./routes/certificate-management";
import { AuthProvider } from "./context/AuthContext";
import PublicVerification from "./routes/public-verification";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const location = useLocation();
  const showNavbar = !location.pathname.startsWith("/training");

  return (
    <>
      <ScrollToTop />
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/feedbacks" element={<Feedbacks />} />
        <Route path="/auth/login" element={<AuthLogin />} />
        <Route path="/auth/register" element={<AuthRegister />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/training" element={<TrainingHome />} />
        <Route path="/training/courses" element={<ProtectedRoute><TrainingCourses /></ProtectedRoute>} />
        <Route path="/training/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
        <Route path="/training/trainer-dashboard" element={<ProtectedRoute allowedRoles={["TRAINER"]}><TrainingTrainer /></ProtectedRoute>} />
        <Route path="/training/admin" element={<ProtectedRoute allowedRoles={["ADMIN"]}><TrainingAdmin /></ProtectedRoute>} />
        <Route path="/training/certificate-management" element={<ProtectedRoute allowedRoles={["ADMIN"]}><TrainingBulkCertificateIssuance /></ProtectedRoute>} />
        <Route path="/training/verify" element={<TrainingVerify />} />
        <Route path="/public-verification" element={<PublicVerification />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showNavbar && <Footer />}
      <ChatBot />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
