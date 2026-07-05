import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useState } from "react";
import { Smartphone, Home, Compass, User, AlertTriangle, LogOut, ChevronRight } from "lucide-react";
import { AuthProvider, useAuth } from "@/shared/auth/AuthContext";
import { ProtectedRoute } from "@/shared/auth/ProtectedRoute";
import { LoginPage } from "@/app/LoginPage";
import { MobileLabList } from "@/features/labs/MobileLabList";
import { MobileKnowledge } from "@/features/knowledge/MobileKnowledge";
import { MobileFaultReport } from "@/features/faults/MobileFaultReport";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function MobileAppLayout() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"labs" | "knowledge" | "fault" | "profile">("labs");

  return (
    <div className="flex justify-center min-h-screen bg-[var(--canvas)] text-[var(--ink-primary)] font-sans select-none animate-fade-in">
      <div className="w-full max-w-md bg-[var(--surface)] border-x border-[var(--border-default)] flex flex-col justify-between shadow-[var(--shadow-md)] min-h-screen">
        
        {/* Mobile top Header */}
        <header className="h-12 border-b border-[var(--border-subtle)] px-4 flex items-center justify-between bg-[var(--surface)] sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[var(--brand)]" />
            <span className="text-xs font-bold text-[var(--ink-primary)]">LabOS 学生端移动门户</span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[9px] font-bold text-[var(--brand)] bg-[var(--brand-subtle)] px-2 py-0.5 rounded-[var(--radius-sm)]">
            <span>在线</span>
          </div>
        </header>

        {/* Scrollable Mobile screen area */}
        <main className="flex-1 overflow-y-auto p-4">
          {activeTab === "labs" && <MobileLabList />}
          {activeTab === "knowledge" && <MobileKnowledge />}
          {activeTab === "fault" && <MobileFaultReport />}
          {activeTab === "profile" && (
            <div className="space-y-4 animate-scale-in">
              <div className="flex items-center gap-3.5 pb-4 border-b border-[var(--border-subtle)]">
                <div className="w-12 h-12 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-lg font-bold uppercase">
                  {user?.name?.charAt(0) ?? "S"}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--ink-primary)]">{user?.name}</h3>
                  <p className="text-[10px] text-[var(--ink-tertiary)] font-mono mt-0.5">{user?.username} · {user?.role}</p>
                </div>
              </div>

              <div className="space-y-1">
                <button 
                  onClick={logout}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-sm)] text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    退出安全登录
                  </span>
                  <ChevronRight className="w-4 h-4 text-rose-400" />
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Mobile bottom Navigation Tabs */}
        <nav className="h-14 border-t border-[var(--border-default)] bg-[var(--surface)] flex items-center justify-around sticky bottom-0 z-40 shrink-0 select-none">
          <button
            onClick={() => setActiveTab("labs")}
            className={`flex flex-col items-center justify-center gap-1 w-20 h-full cursor-pointer ${
              activeTab === "labs" ? "text-[var(--brand)]" : "text-[var(--ink-muted)]"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold">分室</span>
          </button>
          
          <button
            onClick={() => setActiveTab("knowledge")}
            className={`flex flex-col items-center justify-center gap-1 w-20 h-full cursor-pointer ${
              activeTab === "knowledge" ? "text-[var(--brand)]" : "text-[var(--ink-muted)]"
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-bold">说明书</span>
          </button>

          <button
            onClick={() => setActiveTab("fault")}
            className={`flex flex-col items-center justify-center gap-1 w-20 h-full cursor-pointer ${
              activeTab === "fault" ? "text-[var(--brand)]" : "text-[var(--ink-muted)]"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="text-[10px] font-bold">报修</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center gap-1 w-20 h-full cursor-pointer ${
              activeTab === "profile" ? "text-[var(--brand)]" : "text-[var(--ink-muted)]"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-bold">我的</span>
          </button>
        </nav>

      </div>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MobileAppLayout />
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
export default App;
