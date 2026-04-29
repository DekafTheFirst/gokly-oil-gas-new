import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import Feedbacks from "./pages/Feedbacks";
import NotFound from "./pages/NotFound";
import TrainingHome from "./routes/index";
import TrainingCourses from "./routes/courses";
import TrainingDashboard from "./routes/dashboard";
import TrainingVerify from "./routes/verify";
import TrainingAdmin from "./routes/admin";
import { TopNav } from "./components/educert/TopNav";

const queryClient = new QueryClient();
const showNavbar = !window.location.pathname.startsWith("/training");
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        {showNavbar && <Navbar />}
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/feedbacks" element={<Feedbacks />} />
          <Route path="/training" element={<TrainingHome />} />
          <Route path="/training/courses" element={<TrainingCourses />} />
          <Route path="/training/dashboard" element={<TrainingDashboard />} />
          <Route path="/training/verify" element={<TrainingVerify />} />
          <Route path="/training/admin" element={<TrainingAdmin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        {showNavbar && <Footer />}
        <ChatBot />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
