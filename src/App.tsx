import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Keywords from "./pages/Keywords";
import Briefs from "./pages/Briefs";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import NewProject from "./pages/NewProject";
import NotFound from "./pages/NotFound";
import Competitors from "./pages/Competitors";
import { useApp } from "@/contexts/AppContext";
import PlansPage from "./pages/Plans.jsx";
import EditBrief from "./pages/EditBrief";
import BlogPage from "./pages/BlogPage";
import PrivacyPage from "./pages/PrivacyPage";
import PublicServicesPage from "./pages/PublicServicesPage";

import AdminGuard from "@/components/AdminGuard";
import AdminPage from "./pages/AdminPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/public-services" element={<PublicServicesPage />} />
            <Route
              path="/plans"
              element={
                <ProtectedRoute>
                  <PlansPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/keywords"
              element={
                <ProtectedRoute>
                  <Keywords />
                </ProtectedRoute>
              }
            />

            <Route
              path="/briefs"
              element={
                <ProtectedRoute>
                  <Briefs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/briefs/:briefId/edit"
              element={
                <ProtectedRoute>
                  <EditBrief />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/new"
              element={
                <ProtectedRoute>
                  <NewProject />
                </ProtectedRoute>
              }
            />
            <Route
              path="/competitor-analysis"
              element={
                <ProtectedRoute>
                  <Competitors />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
            <Route
              path="/admin"
              element={
                <AdminGuard>
                  <AdminPage />
                </AdminGuard>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
