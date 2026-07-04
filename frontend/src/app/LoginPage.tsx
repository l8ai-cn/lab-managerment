import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, ShieldCheck, Eye, EyeOff, Sparkles, Server } from "lucide-react";
import { useAuth } from "@/shared/auth/AuthContext";

/**
 * 100% Brand-new Written LoginPage (Stripe-style / layout.md Template F)
 * Strictly zero AntD, fully styled using custom DESIGN.md tokens & CSS variables
 */
export function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [errorMsg, setErrorMessage] = useState("");

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/dashboard";

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
      setErrorMessage("用户名或密码错误，请核对后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--canvas)] animate-fade-in font-sans select-none">
      {/* 40% Left Panel: Brand Spec Panel per layout.md specs */}
      <div className="hidden lg:flex lg:w-[40%] bg-[var(--surface-inset)] border-r border-[var(--border-subtle)] p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-[var(--brand-subtle)] border border-[var(--brand)]/10 rounded-[var(--radius-sm)]">
            <Sparkles className="w-4 h-4 text-[var(--brand)]" />
            <span className="text-xs font-semibold text-[var(--brand)] uppercase tracking-wider">LabOS v0.3.5</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--ink-primary)]">
              高校实验室<br />数字化管理平台
            </h2>
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed max-w-sm">
              覆盖实验室基本信息、仪器设备、开放预约、大纲项目、故障运维、基表填报、安全态势大屏等全生命调度。
            </p>
          </div>
        </div>

        <div className="space-y-4 relative z-10 border-t border-[var(--border-subtle)] pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)]">
              <Server className="w-4 h-4 text-[var(--ink-secondary)]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--ink-primary)]">生产级无状态部署</div>
              <div className="text-[10px] text-[var(--ink-tertiary)] mt-0.5">SQLite & PostgreSQL 双模式支持</div>
            </div>
          </div>
        </div>
      </div>

      {/* 60% Right Panel: Premium Custom Stripe-Style Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="max-w-[400px] w-full space-y-6 animate-scale-in">
          
          {/* Logo & Headline */}
          <div className="text-center md:text-left space-y-2">
            <div className="inline-flex items-center justify-center w-11 h-11 bg-[var(--brand)] text-white rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] mb-2">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 22H22L12 2Z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--ink-primary)]">登录 LabOS 系统</h1>
            <p className="text-xs text-[var(--ink-secondary)]">请输入教务处统一授权的实验中心账号</p>
          </div>

          {/* Form Error alert (Stripe style Rose-600 AlertCard) */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-[var(--status-fault-subtle)] text-[var(--status-fault)] border border-[var(--status-fault)]/20 rounded-[var(--radius-sm)] text-xs font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--status-fault)] mt-1.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Core Login Form (zero antd dependencies) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)]">
                用户名
              </label>
              <input
                type="text"
                placeholder="请输入用户名..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] outline-none transition-all focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--focus-ring)]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)]">
                  密码
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] outline-none transition-all focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--focus-ring)]"
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
                className="w-full inline-flex items-center justify-center gap-2 py-2 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                登 录
              </button>
            </div>
          </form>

          {/* Divider and SSO */}
          <div className="relative py-2 select-none">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-subtle)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--canvas)] px-2.5 text-[var(--ink-tertiary)] font-medium">统一身份认证 / SSO</span>
            </div>
          </div>

          <div>
            <a
              href="/api/v1/auth/sso/login"
              className="w-full inline-flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] hover:bg-[var(--surface-inset)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              统一 SSO 单点登录
            </a>
          </div>

          {/* Hint Card */}
          <div className="p-3 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] text-[10px] text-[var(--ink-secondary)] leading-normal">
            <div className="font-semibold text-[var(--ink-primary)] mb-1">系统演示账号</div>
            <div className="flex gap-4 font-mono">
              <div>账号: <code className="bg-[var(--surface-inset)] px-1 rounded">admin</code></div>
              <div>密码: <code className="bg-[var(--surface-inset)] px-1 rounded">admin123</code></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
