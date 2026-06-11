import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Login from "./pages/Login";
import Registry from "./pages/Registry";
import AddEntity from "./pages/AddEntity";
import EmployeeDetail from "./pages/EmployeeDetail";
import ViewProfile from "./pages/ViewProfile";
import NotFound from "./pages/NotFound";
import Callback from "./pages/Callback";
import Consent from "./pages/Consent";
import Logout from "./pages/Logout";
import Settings from "./pages/Settings";

const ExternalRedirect = ({ to }: { to: string }) => {
  const search = window.location.search; // preserve ?flow=... and any other params
  window.location.replace(to + search);
  return null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent re-fetching when window regains focus
      retry: false,
      staleTime: 5000,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  // Validate JWT role is an array — old tokens (pre-fix) had role as a string which
  // causes the registry to return 403 (CustomJwtAuthenticationConverter casts to ArrayList).
  const token = sessionStorage.getItem("accessToken");
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.role !== undefined && !Array.isArray(payload.role)) {
          sessionStorage.clear();
          return <Navigate to="/login" replace />;
        }
      }
    } catch { /* malformed token — let the API call fail naturally */ }
  }

  return <>{children}</>;
};

const App = () => {
  const RootRedirect = () => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) return <Navigate to="/login" replace />;
    const role = sessionStorage.getItem("userRole") || "admin";
    return <Navigate to={role === "employee" ? "/profile" : "/employees"} replace />;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/employees" element={<ProtectedRoute><Registry /></ProtectedRoute>} />
              <Route path="/entity/new" element={<ProtectedRoute><AddEntity /></ProtectedRoute>} />
              <Route path="/employee/:osid" element={<ProtectedRoute><EmployeeDetail /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ViewProfile /></ProtectedRoute>} />
              <Route path="/callback" element={<Callback />} />
              <Route path="/consent" element={<Consent />} />
              <Route path="/logout" element={<Logout />} />
              <Route path="/registration" element={<Navigate to="/login" replace />} />
              <Route path="/verification" element={<Navigate to="/login" replace />} />
              <Route path="/recovery" element={<ExternalRedirect to="https://cuenta.digital.gob.do/ui/recovery" />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/error" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
