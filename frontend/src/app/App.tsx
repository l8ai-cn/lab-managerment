import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntApp, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/app/LoginPage";
import { DashboardPage } from "@/features/dashboard/components/DashboardPage";
import { DataReportingPage } from "@/features/data-reporting/components/DataReportingPage";
import { ExperimentDetail } from "@/features/experiments/components/ExperimentDetail";
import { ExperimentForm } from "@/features/experiments/components/ExperimentForm";
import { ExperimentList } from "@/features/experiments/components/ExperimentList";
import {
  ProjectEditPage,
  ProjectFormPage,
} from "@/features/experiment-projects/components/ProjectForm";
import { ProjectList } from "@/features/experiment-projects/components/ProjectList";
import { FaultDetail } from "@/features/faults/components/FaultDetail";
import { FaultList } from "@/features/faults/components/FaultList";
import { InstrumentBookingList } from "@/features/instruments/components/InstrumentBookingList";
import { InstrumentList } from "@/features/instruments/components/InstrumentList";
import { IntegrationPage } from "@/features/integrations/components/IntegrationPage";
import { LabBookingList } from "@/features/lab-bookings/components/LabBookingList";
import { LabChangeDetail } from "@/features/lab-changes/components/LabChangeDetail";
import { LabChangeList } from "@/features/lab-changes/components/LabChangeList";
import { LabStaffList } from "@/features/lab-staff/components/LabStaffList";
import { LabDetail } from "@/features/labs/components/LabDetail";
import { LabForm } from "@/features/labs/components/LabForm";
import { LabList } from "@/features/labs/components/LabList";
import { PaymentOrderList } from "@/features/payments/components/PaymentOrderList";
import { StatisticsPage } from "@/features/statistics/components/StatisticsPage";
import { AuthProvider } from "@/shared/auth/AuthContext";
import { ProtectedRoute } from "@/shared/auth/ProtectedRoute";
import { AppShell } from "@/shared/layout/AppShell";
import { appTheme } from "@/shared/theme/appTheme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={zhCN} theme={appTheme}>
        <AntApp message={{ maxCount: 3 }}>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <AppShell />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/labs" element={<LabList />} />
                  <Route path="/labs/new" element={<LabForm />} />
                  <Route path="/labs/:id" element={<LabDetail />} />
                  <Route path="/lab-staff" element={<LabStaffList />} />
                  <Route path="/lab-changes" element={<LabChangeList />} />
                  <Route path="/lab-changes/:id" element={<LabChangeDetail />} />
                  <Route path="/instruments" element={<InstrumentList />} />
                  <Route path="/instrument-bookings" element={<InstrumentBookingList />} />
                  <Route path="/lab-bookings" element={<LabBookingList />} />
                  <Route path="/experiment-projects" element={<ProjectList />} />
                  <Route path="/experiment-projects/new" element={<ProjectFormPage />} />
                  <Route path="/experiment-projects/:id/edit" element={<ProjectEditPage />} />
                  <Route path="/experiments" element={<ExperimentList />} />
                  <Route path="/experiments/new" element={<ExperimentForm />} />
                  <Route path="/experiments/:id" element={<ExperimentDetail />} />
                  <Route path="/faults" element={<FaultList />} />
                  <Route path="/faults/:id" element={<FaultDetail />} />
                  <Route path="/data-reporting" element={<DataReportingPage />} />
                  <Route path="/statistics" element={<StatisticsPage />} />
                  <Route path="/integrations" element={<IntegrationPage />} />
                  <Route path="/payments" element={<PaymentOrderList />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
