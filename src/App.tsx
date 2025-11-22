import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContextPHP";
import { DashboardLayout } from "@/components/DashboardLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Deposit from "./pages/Deposit";
import Cards from "./pages/Cards";
import CardDetails from "./pages/CardDetails";
import CustomerSetup from "./pages/CustomerSetup";
import Wallets from "./pages/Wallets";
import Admin from "./pages/Admin"; // Legacy single admin page (optionnel)
import AdminOverview from "./pages/AdminOverview";
import AdminCards from "./pages/AdminCards";
import AdminCustomers from "./pages/AdminCustomers";
import AdminSettings from "./pages/AdminSettings";
import AdminApiLogs from "./pages/AdminApiLogs";
import AdminApiConfig from "./pages/AdminApiConfig";
import NotFound from "./pages/NotFound";

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
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
            <Route path="/deposit" element={<DashboardLayout><Deposit /></DashboardLayout>} />
            <Route path="/wallets" element={<DashboardLayout><Wallets /></DashboardLayout>} />
            <Route path="/cards" element={<DashboardLayout><Cards /></DashboardLayout>} />
            <Route path="/cards/:cardId" element={<DashboardLayout><CardDetails /></DashboardLayout>} />
            <Route path="/customer-setup" element={<DashboardLayout><CustomerSetup /></DashboardLayout>} />
            {/* Admin section */}
            <Route path="/admin" element={<DashboardLayout><AdminOverview /></DashboardLayout>} />
            <Route path="/admin/overview" element={<DashboardLayout><AdminOverview /></DashboardLayout>} />
            <Route path="/admin/cards" element={<DashboardLayout><AdminCards /></DashboardLayout>} />
            <Route path="/admin/customers" element={<DashboardLayout><AdminCustomers /></DashboardLayout>} />
            <Route path="/admin/settings" element={<DashboardLayout><AdminSettings /></DashboardLayout>} />
            <Route path="/admin/api-logs" element={<DashboardLayout><AdminApiLogs /></DashboardLayout>} />
            <Route path="/admin/api-config" element={<DashboardLayout><AdminApiConfig /></DashboardLayout>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
