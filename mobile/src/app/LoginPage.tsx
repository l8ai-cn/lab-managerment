import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, Eye, EyeOff, Smartphone } from "lucide-react";
import { useAuth } from "@/shared/auth/AuthContext";

/**
 * High-fidelity Mobile optimized LoginPage (Stripe-mobile layout.md Template F)
 */
export function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("student1");
  const [password, setPassword] = useState("student123");
  const [errorMsg, setErrorMessage] = useState("");

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";

  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage("请填入用户名及密码");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setErrorMessage("用户名或密码错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--canvas)] p-6 font-sans select-none animate-fade-in">
      <div className="w-full max-w-sm space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-11 h-11 bg-[var(--brand)] text-white rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] mb-2">
            <Smartphone className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--ink-primary)]">LabOS 移动端</h1>
          <p className="text-xs text-[var(--ink-secondary)]">请输入本校学生或临时访客账号</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-[var(--status-fault-subtle)] text-[var(--status-fault)] border border-[var(--status-fault)]/20 rounded-[var(--radius-sm)] text-xs font-medium">
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)]">
              账号用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)]">
              密码
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3 pr-10 py-2 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] active:scale-[0.98] cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              登录移动端
            </button>
          </div>
        </form>

        {/* Demo hints */}
        <div className="p-3 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] text-[10px] text-[var(--ink-secondary)] leading-normal">
          <div className="font-semibold text-[var(--ink-primary)] mb-1">演示学生账号</div>
          <div className="flex gap-4 font-mono">
            <div>账号: <code className="bg-[var(--surface-inset)] px-1 rounded">student1</code></div>
            <div>密码: <code className="bg-[var(--surface-inset)] px-1 rounded">student123</code></div>
          </div>
        </div>

      </div>
    </div>
  );
}
