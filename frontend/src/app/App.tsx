import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "@/shared/auth/AuthContext";
import { ProtectedRoute } from "@/shared/auth/ProtectedRoute";
import { AppShell } from "@/shared/layout/AppShell";
import { LoginPage } from "@/app/LoginPage";
import { DashboardPage } from "@/features/dashboard/components/DashboardPage";

// Initialized clean QueryClient for our state synchronization
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * 100% Brand-new Written App entry point (Core of Batch 1 Router & Layout)
 * Strictly zero AntD ConfigProvider or Locale wrap. Fully standard lightweight SPA routing.
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Authenticated Base Layout wrap with Protected guards */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              {/* Fallback index route redirecting directly to premium telemetry dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<div className="p-8 text-center text-xs text-[var(--ink-secondary)]">页面正在 clean-sheet 重新书写中...</div>} />
            </Route>

            {/* Public Entry Gate portal */}
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
