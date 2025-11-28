import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Login from "./pages/Login";
import Registry from "./pages/Registry";
import ViewEntity from "./pages/ViewEntity";
import EditEntity from "./pages/EditEntity";
import AddEntity from "./pages/AddEntity";
import ViewProfile from "./pages/ViewProfile";
import Claims from "./pages/Claims";
import PendingClaims from "./pages/PendingClaims";
import ApprovedClaims from "./pages/ApprovedClaims";
import DocumentationFull from "./pages/DocumentationFull";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/documentation" element={<DocumentationFull />} />
            <Route path="/registry" element={<ProtectedRoute><Registry /></ProtectedRoute>} />
            <Route path="/entity/new" element={<ProtectedRoute><AddEntity /></ProtectedRoute>} />
            <Route path="/entity/:id" element={<ProtectedRoute><ViewEntity /></ProtectedRoute>} />
            <Route path="/entity/:id/edit" element={<ProtectedRoute><EditEntity /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ViewProfile /></ProtectedRoute>} />
            <Route path="/claims" element={<ProtectedRoute><Claims /></ProtectedRoute>} />
            <Route path="/pending-claims" element={<ProtectedRoute><PendingClaims /></ProtectedRoute>} />
            <Route path="/approved-claims" element={<ProtectedRoute><ApprovedClaims /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
