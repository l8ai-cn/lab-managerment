import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Brand-new written ProtectedRoute (Batch 1 Core Primitive)
 * 100% Free of Ant Design Spin, utilizes GPU-composited animate-spin SVG spinner.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--canvas)] text-[var(--ink-secondary)] select-none animate-fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand)] mb-3" />
        <span className="text-xs font-medium tracking-wide">正在初始化安全会话...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
