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
import TraineeRegister from "./pages/TraineeRegister";
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
import UserManagement from "./routes/user-management";
import CourseManagement from "./routes/course-management";
import CourseCreation from "./routes/course-creation";
import CourseDetail from "./routes/course-creation-details";
import OrganizationManagement from "./routes/organization-management";
import OrganizationCreation from "./routes/organization-creation";
import OrganizationDetails from "./routes/organization-details";
import EngagementManagement from "./routes/engagement-management";
import EngagementCreation from "./routes/engagement-creation";
import EngagementDetails from "./routes/engagement-details";

const queryClient = new QueryClient();

const TRAINEE_ROLES = ["TRAINEE", "STUDENT"];

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
        <Route path="/register" element={<TraineeRegister />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/training" element={<TrainingHome />} />
        <Route path="/training/courses" element={<ProtectedRoute><TrainingCourses /></ProtectedRoute>} />
        {/* Generic entry-point: redirects to the correct dashboard for the logged-in role */}
        <Route path="/training/home" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
        {/* Trainee dashboard — canonical URL. /training/dashboard kept as alias for old links. */}
        <Route path="/training/trainee-dashboard" element={<ProtectedRoute allowedRoles={TRAINEE_ROLES}><TrainingDashboard /></ProtectedRoute>} />
        <Route path="/training/dashboard" element={<ProtectedRoute allowedRoles={TRAINEE_ROLES}><TrainingDashboard /></ProtectedRoute>} />
        <Route path="/training/trainer-dashboard" element={<ProtectedRoute allowedRoles={["TRAINER"]}><TrainingTrainer /></ProtectedRoute>} />
        <Route path="/training/admin" element={<ProtectedRoute allowedRoles={["ADMIN"]}><TrainingAdmin /></ProtectedRoute>} />
        <Route path="/training/certificate-management" element={<ProtectedRoute allowedRoles={["ADMIN"]}><TrainingBulkCertificateIssuance /></ProtectedRoute>} />
        <Route path="/training/user-management" element={<ProtectedRoute allowedRoles={["ADMIN"]}><UserManagement /></ProtectedRoute>} />
        <Route path="/training/course-management" element={<ProtectedRoute allowedRoles={["ADMIN"]}><CourseManagement /></ProtectedRoute>} />
        <Route path="/training/course-creation" element={<ProtectedRoute allowedRoles={["ADMIN"]}><CourseCreation /></ProtectedRoute>} />
        <Route path="/training/course-creation-details" element={<ProtectedRoute allowedRoles={["ADMIN"]}><CourseDetail /></ProtectedRoute>} />
        <Route path="/training/course/:courseId" element={<ProtectedRoute allowedRoles={["ADMIN"]}><CourseDetail /></ProtectedRoute>} />
        <Route path="/training/organization-management" element={<ProtectedRoute allowedRoles={["ADMIN"]}><OrganizationManagement /></ProtectedRoute>} />
        <Route path="/training/organization-management/:organizationId" element={<ProtectedRoute allowedRoles={["ADMIN"]}><OrganizationDetails /></ProtectedRoute>} />
        <Route path="/training/organization-management/create" element={<ProtectedRoute allowedRoles={["ADMIN"]}><OrganizationCreation /></ProtectedRoute>} />
        <Route path="/training/organization-management/create-details" element={<ProtectedRoute allowedRoles={["ADMIN"]}><OrganizationCreation /></ProtectedRoute>} />
        <Route path="/training/engagement-management" element={<ProtectedRoute allowedRoles={["ADMIN"]}><EngagementManagement /></ProtectedRoute>} />
        <Route path="/training/engagement-management/:engagementId" element={<ProtectedRoute allowedRoles={["ADMIN"]}><EngagementDetails /></ProtectedRoute>} />
        <Route path="/training/engagement-creation" element={<ProtectedRoute allowedRoles={["ADMIN"]}><EngagementCreation /></ProtectedRoute>} />
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
        <Sonner position="top-right" />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
