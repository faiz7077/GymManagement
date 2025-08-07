import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { MainLayout } from "@/components/layout/MainLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Members } from "@/pages/Members";
import { Enquiries } from "@/pages/Enquiries";
import { BodyMeasurements } from "@/pages/BodyMeasurements";
import { Staff } from "@/pages/Staff";
import { Receipts } from "@/pages/Receipts";
import { StaffSalary } from "@/pages/StaffSalary";
import { Expenses } from "@/pages/Expenses";
import { Reports } from "@/pages/Reports";
import MonthlyTransactionReport from "@/pages/MonthlyTransactionReport";
import { WhatsAppAutomation } from "@/pages/WhatsAppAutomation";
import { WhatsAppSettings } from "@/pages/WhatsAppSettings";
import NotFound from "./pages/NotFound";
import { AttendancePage } from "./pages/Attendancee";
import { StaffAttendancePage } from "./pages/StaffAttendance";
import { whatsappService } from "@/services/whatsappService";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (only for login)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={
      <PublicRoute>
        <LoginForm />
      </PublicRoute>
    } />
    
    <Route path="/" element={
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    }>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="members" element={<Members />} />
      <Route path="enquiries" element={<Enquiries />} />
      <Route path="receipts" element={<Receipts />} />
      <Route path="attendance" element={<AttendancePage/>}/>
      <Route path="staff-attendance" element={<StaffAttendancePage />} />
      <Route path="measurements" element={<BodyMeasurements />} />
      <Route path="staff" element={<Staff />} />
      <Route path="salary" element={<StaffSalary />} />
      <Route path="expenses" element={<Expenses />} />
      <Route path="reports" element={<Reports />} />
      <Route path="monthly-report" element={<MonthlyTransactionReport />} />
      <Route path="whatsapp" element={<WhatsAppAutomation />} />
      <Route path="whatsapp-settings" element={<WhatsAppSettings />} />
      {/* More routes will be added here */}
    </Route>
    
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => {
  useEffect(() => {
    // Start WhatsApp automation service when app loads
    console.log('🚀 Starting WhatsApp automation service...');
    whatsappService.start();
    
    // Cleanup on unmount
    return () => {
      whatsappService.stop();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
