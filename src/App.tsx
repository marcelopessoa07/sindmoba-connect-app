import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/layout/AppLayout";
import MainPage from "./pages/MainPage";
import NewsPage from "./pages/NewsPage";
import EventsPage from "./pages/EventsPage";
import DocumentsPage from "./pages/DocumentsPage";
import LegislationPage from "./pages/LegislationPage";
import FAQPage from "./pages/FAQPage";
import MembershipPage from "./pages/MembershipPage";
import FileSubmissionPage from "./pages/FileSubmissionPage";
import ContactPage from "./pages/ContactPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route path="/main" element={<MainPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/legislation" element={<LegislationPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/membership" element={<MembershipPage />} />
              <Route path="/file-submission" element={<FileSubmissionPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
