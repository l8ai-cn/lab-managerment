import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Smartphone, Home, Compass, User, ChevronRight, LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "@/shared/auth/AuthContext";

/**
 * 100% Brand-new Written Mobile App Shell for Student Portals
 * Strictly zero AntD, fits premium Mobile SaaS bottom-tab viewport specs (Template G)
 */
export function MobileApp() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"home" | "profile">("home");
  const navigate = useNavigate();

  return (
    <div className="flex justify-center min-h-screen bg-[var(--canvas)] text-[var(--ink-primary)] font-sans select-none">
      
      {/* Hand-held Viewport Emulator on high-resolution screens, fluid on native smartphones */}
      <div className="w-full max-w-md bg-[var(--surface)] border-x border-[var(--border-default)] flex flex-col justify-between shadow-[var(--shadow-md)]">
        
        {/* Mobile Header (48px h per Template G specs) */}
        <header className="h-12 border-b border-[var(--border-subtle)] px-4 flex items-center justify-between bg-[var(--surface)] sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[var(--brand)]" />
            <span className="text-xs font-semibold text-[var(--ink-primary)]">LabOS 移动端</span>
          </div>
          <button 
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[var(--brand)] hover:underline cursor-pointer"
          >
            返回桌面端 <ArrowLeft className="w-3 h-3" />
          </button>
        </header>

        {/* Scrollable fluid body */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "home" ? (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[var(--brand-subtle)] p-4 border border-[var(--brand)]/10 rounded-[var(--radius-md)]">
                <span className="block text-xs font-bold text-[var(--brand)] uppercase tracking-wide">欢迎回来</span>
                <span className="block text-lg font-bold text-[var(--brand)] mt-1">{user?.name || "同学"}</span>
                <span className="block text-[10px] text-[var(--ink-tertiary)] mt-1">您可以通过手机便捷提报故障以及核对日常预定。</span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[var(--ink-secondary)]">快捷服务入口</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Link 
                    to="/labs" 
                    className="p-4 bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] flex flex-col items-center justify-center text-center hover:border-[var(--brand)] transition-all"
                  >
                    <Home className="w-5 h-5 text-[var(--brand)] mb-2" />
                    <span className="text-xs font-semibold">分室基本台账</span>
                  </Link>
                  <Link 
                    to="/knowledge" 
                    className="p-4 bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] flex flex-col items-center justify-center text-center hover:border-[var(--brand)] transition-all"
                  >
                    <Compass className="w-5 h-5 text-indigo-600 mb-2" />
                    <span className="text-xs font-semibold">仪器说明书检索</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-subtle)]">
                <div className="w-12 h-12 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-lg font-semibold uppercase">
                  {user?.name?.charAt(0) ?? "U"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--ink-primary)]">{user?.name}</div>
                  <div className="text-[10px] text-[var(--ink-tertiary)] mt-0.5">{user?.username} · {user?.role}</div>
                </div>
              </div>

              <div className="space-y-1">
                <button 
                  onClick={logout}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-sm)] text-rose-600 hover:bg-rose-50 text-xs font-medium cursor-pointer transition-colors"
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

        {/* Mobile Tab Navigation Bar (Strictly conforming to Template G bottom tabs spec) */}
        <nav className="h-14 border-t border-[var(--border-default)] bg-[var(--surface)] flex items-center justify-around shrink-0 relative z-40">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center justify-center gap-1 w-20 h-full cursor-pointer transition-colors ${
              activeTab === "home" ? "text-[var(--brand)]" : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold">主页</span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center gap-1 w-20 h-full cursor-pointer transition-colors ${
              activeTab === "profile" ? "text-[var(--brand)]" : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
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
export default MobileApp;
