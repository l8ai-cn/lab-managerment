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
              
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<div className="p-8 text-center text-xs text-[var(--ink-secondary)]">页面正在 clean-sheet 重新书写中...</div>} />
            </Route>
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
