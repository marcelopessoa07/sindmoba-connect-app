
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/auth/PrivateRoute";

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
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import AdminDocumentsPage from "./pages/admin/AdminDocumentsPage";
import AdminEventsPage from "./pages/admin/AdminEventsPage";
import AdminNewsPage from "./pages/admin/AdminNewsPage";
import AdminSubmissionsPage from "./pages/admin/AdminSubmissionsPage";
import AdminFAQPage from "./pages/admin/AdminFAQPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              <Route element={
                <PrivateRoute>
                  <AppLayout />
                </PrivateRoute>
              }>
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/documents" element={<AdminDocumentsPage />} />
                <Route path="/admin/events" element={<AdminEventsPage />} />
                <Route path="/admin/news" element={<AdminNewsPage />} />
                <Route path="/admin/submissions" element={<AdminSubmissionsPage />} />
                <Route path="/admin/faq" element={<AdminFAQPage />} />
                <Route path="/main" element={<MainPage />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/legislation" element={<LegislationPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/membership" element={<MembershipPage />} />
                <Route path="/file-submission" element={<FileSubmissionPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <Sonner />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
