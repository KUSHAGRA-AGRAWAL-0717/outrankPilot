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
import Settings from "./pages/Integrations.js";
import NewProject from "./pages/NewProject";
import NotFound from "./pages/NotFound";
import Competitors from "./pages/Competitors";
import { useApp } from "@/contexts/AppContext";
import PlansPage from "./pages/Plans.jsx";
import EditBrief from "./pages/EditBrief";
import BlogPage from "./pages/BlogPage";
import PrivacyPage from "./pages/PrivacyPage";
import PublicServicesPage from "./pages/PublicServicesPage";
import AuthCallback from "./pages/AuthCallback";
import AuthNotionCallback from "./pages/AuthNotionCallback";
import Autopilot from "./pages/Autopilot.js";
import AdminGuard from "@/components/AdminGuard";
import AdminPage from "./pages/AdminPage";
import Onboarding from "./pages/Onboarding";
import Support from "./pages/Support";
import Affiliate from "./pages/Affiliate";
import Examples from "./pages/Examples";
import Features from "./pages/Features";

import { DashboardLayout } from "./components/layout/DashboardLayout.js";
import Integrations from "./pages/Integrations.jsx";
import BlogPostPage from "./pages/BlogPostPage.js";

const PageWithSidebar = ({ children }) => {
  return <DashboardLayout>{children}</DashboardLayout>;
};

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
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/affiliate-program" element={<Affiliate />} />
            <Route path="/support" element={<Support />} />
            <Route path="/examples" element={<Examples />} />
            <Route path="/features/:id" element={<Features />} />
            <Route
              path="/auth/notion/callback"
              element={<AuthNotionCallback />}
            />
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
                  <PageWithSidebar>
                    <Dashboard />
                  </PageWithSidebar>
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            {/* just example route to check the pages */}
            {/* <Route
              path="/step-project"
              element={
                <ProtectedRoute>
                  <StepProject />
                </ProtectedRoute>
              }
            />

            <Route
              path="/step-integrations"
              element={
                <ProtectedRoute>
                  <StepIntegrations />
                </ProtectedRoute>
              }
            />

            <Route
              path="/step-content"
              element={
                <ProtectedRoute>
                  <StepContent />
                </ProtectedRoute>
              }
            />

            <Route
              path="/step-keywords"
              element={
                <ProtectedRoute>
                  <StepKeywords />
                </ProtectedRoute>
              }
            /> */}

            <Route
              path="/keywords"
              element={
                <ProtectedRoute>
                  <PageWithSidebar>
                    <Keywords />
                  </PageWithSidebar>
                </ProtectedRoute>
              }
            />

            <Route
              path="/briefs"
              element={
                <ProtectedRoute>
                  <PageWithSidebar>
                    <Briefs />
                  </PageWithSidebar>
                </ProtectedRoute>
              }
            />
            <Route
              path="/briefs/:briefId/edit"
              element={
                <ProtectedRoute>
                  <PageWithSidebar>
                    <EditBrief />
                  </PageWithSidebar>
                </ProtectedRoute>
              }
            />
            <Route
              path="/autopilot"
              element={
                <ProtectedRoute>
                  <PageWithSidebar>
                    <Autopilot />
                  </PageWithSidebar>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <PageWithSidebar>
                    <Calendar />
                  </PageWithSidebar>
                </ProtectedRoute>
              }
            />
            <Route
              path="/integrations"
              element={
                <ProtectedRoute>
                  <PageWithSidebar>
                    <Integrations />
                  </PageWithSidebar>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/new"
              element={
                <ProtectedRoute>
                  <PageWithSidebar>
                    <NewProject />
                  </PageWithSidebar>
                </ProtectedRoute>
              }
            />
            <Route
              path="/competitor-analysis"
              element={
                <ProtectedRoute>
                  <PageWithSidebar>
                    <Competitors />
                  </PageWithSidebar>
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
