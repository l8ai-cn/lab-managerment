import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "@/shared/auth/AuthContext";
import { ProtectedRoute } from "@/shared/auth/ProtectedRoute";
import { AppShell } from "@/shared/layout/AppShell";
import { LoginPage } from "@/app/LoginPage";
import { DashboardPage } from "@/features/dashboard/components/DashboardPage";
import { LabListPage } from "@/features/labs/components/LabListPage";
import { SpaceManagementPage } from "@/features/spaces/components/SpaceManagementPage";
import { LabStaffListPage } from "@/features/lab-staff/components/LabStaffListPage";
import { LabChangeListPage } from "@/features/lab-changes/components/LabChangeListPage";
import { CourseListPage } from "@/features/experiment-projects/components/CourseListPage";
import { ProjectList } from "@/features/experiment-projects/components/ProjectList";
import { ProjectFormPage, ProjectEditPage } from "@/features/experiment-projects/components/ProjectForm";
import { ExperimentListPage } from "@/features/experiments/components/ExperimentListPage";
import { ExperimentDetailPage } from "@/features/experiments/components/ExperimentDetailPage";
import { ExperimentForm } from "@/features/experiments/components/ExperimentForm";
import { FaultListPage } from "@/features/faults/components/FaultListPage";
import { FaultDetailPage } from "@/features/faults/components/FaultDetailPage";
import { KnowledgePage } from "@/features/knowledge/components/KnowledgePage";
import { DataReportingPage } from "@/features/data-reporting/components/DataReportingPage";
import { InstrumentListPage } from "@/features/instruments/components/InstrumentListPage";
import { InstrumentBookingListPage } from "@/features/instruments/components/InstrumentBookingListPage";
import { LabBookingListPage } from "@/features/lab-bookings/components/LabBookingListPage";
import { UserListPage } from "@/features/users/components/UserListPage";
import { PaymentOrderList } from "@/features/payments/components/PaymentOrderList";
import { StatisticsPage } from "@/features/statistics/components/StatisticsPage";
import { IntegrationPage } from "@/features/integrations/components/IntegrationPage";
import { ClassBoardPage } from "@/features/access-control/components/ClassBoardPage";
import { MobileApp } from "@/mobile/MobileApp";

// Rules configurations added in Batch 3 extension loop
import { InstrumentBookingRulesPage } from "@/features/instruments/components/InstrumentBookingRulesPage";
import { LabBookingRulesPage } from "@/features/lab-bookings/components/LabBookingRulesPage";
import { UsageApprovalPage } from "@/features/lab-bookings/components/UsageApprovalPage";

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
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/labs" element={<LabListPage />} />
              <Route path="/spaces" element={<SpaceManagementPage />} />
              <Route path="/lab-staff" element={<LabStaffListPage />} />
              <Route path="/lab-changes" element={<LabChangeListPage />} />
              
              {/* Teaching and Research Group (Batch 4) */}
              <Route path="/courses" element={<CourseListPage />} />
              <Route path="/experiment-projects" element={<ProjectList />} />
              <Route path="/experiment-projects/new" element={<ProjectFormPage />} />
              <Route path="/experiment-projects/:id/edit" element={<ProjectEditPage />} />
              
              <Route path="/experiments" element={<ExperimentListPage />} />
              <Route path="/experiments/new" element={<ExperimentForm />} />
              <Route path="/experiments/:id" element={<ExperimentDetailPage />} />

              {/* Equipment and booking Systems (Batch 3) */}
              <Route path="/instruments" element={<InstrumentListPage />} />
              <Route path="/instruments/rules" element={<InstrumentBookingRulesPage />} />
              <Route path="/instrument-bookings" element={<InstrumentBookingListPage />} />
              
              <Route path="/lab-bookings" element={<LabBookingListPage />} />
              <Route path="/lab-bookings/rules" element={<LabBookingRulesPage />} />
              <Route path="/lab-bookings/usage-approval" element={<UsageApprovalPage />} />

              <Route path="/faults" element={<FaultListPage />} />
              <Route path="/faults/:id" element={<FaultDetailPage />} />

              <Route path="/knowledge" element={<KnowledgePage />} />
              <Route path="/data-reporting" element={<DataReportingPage />} />

              {/* System Configuration (Batch 5) */}
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/integrations" element={<IntegrationPage />} />
              <Route path="/class-boards" element={<ClassBoardPage />} />
              <Route path="/users" element={<UserListPage />} />
              <Route path="/payments" element={<PaymentOrderList />} />
              
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<div className="p-8 text-center text-xs text-[var(--ink-secondary)]">页面正在 clean-sheet 重新书写中...</div>} />
            </Route>

            {/* Mobile H5 Viewport */}
            <Route
              path="/mobile/*"
              element={
                <ProtectedRoute>
                  <MobileApp />
                </ProtectedRoute>
              }
            />

            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
