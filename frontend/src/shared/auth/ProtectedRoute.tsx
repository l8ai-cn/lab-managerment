import { Spin } from "antd";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./ProtectedRoute.css";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="protected-route-loading">
        <Spin size="large" tip="加载中…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
