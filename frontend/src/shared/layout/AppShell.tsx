import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Home, 
  Layers, 
  Users, 
  GitBranch, 
  Microscope, 
  CalendarRange, 
  Settings, 
  DoorOpen, 
  ClipboardCheck, 
  BookOpen, 
  FlaskConical, 
  LineChart, 
  AlertTriangle, 
  FileSpreadsheet, 
  Search, 
  LayoutDashboard, 
  BarChart, 
  Plug, 
  Monitor, 
  UserCog, 
  CreditCard, 
  Smartphone,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/shared/auth/AuthContext";
import { getRouteMeta } from "@/shared/layout/routeMeta";

interface SidebarItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarGroup {
  key: string;
  label: string;
  children: SidebarItem[];
}

const MENU_ITEMS: SidebarGroup[] = [
  {
    key: "lab-group",
    label: "实验室管理",
    children: [
      { key: "/labs", icon: <Home className="w-4 h-4" />, label: "实验室" },
      { key: "/spaces", icon: <Layers className="w-4 h-4" />, label: "空间管理" },
      { key: "/lab-staff", icon: <Users className="w-4 h-4" />, label: "实验员" },
      { key: "/lab-changes", icon: <GitBranch className="w-4 h-4" />, label: "变更管理" },
    ],
  },
  {
    key: "booking-group",
    label: "设备与预约",
    children: [
      { key: "/instruments", icon: <Microscope className="w-4 h-4" />, label: "仪器台账" },
      { key: "/instrument-bookings", icon: <CalendarRange className="w-4 h-4" />, label: "仪器预约" },
      { key: "/instruments/rules", icon: <Settings className="w-4 h-4" />, label: "仪器规则" },
      { key: "/lab-bookings", icon: <DoorOpen className="w-4 h-4" />, label: "实验室预约" },
      { key: "/lab-bookings/rules", icon: <Settings className="w-4 h-4" />, label: "实验室规则" },
      { key: "/lab-bookings/usage-approval", icon: <ClipboardCheck className="w-4 h-4" />, label: "使用记录审核" },
    ],
  },
  {
    key: "research-group",
    label: "教学科研",
    children: [
      { key: "/courses", icon: <BookOpen className="w-4 h-4" />, label: "课程管理" },
      { key: "/experiment-projects", icon: <FlaskConical className="w-4 h-4" />, label: "实验项目" },
      { key: "/experiments", icon: <LineChart className="w-4 h-4" />, label: "科研实验" },
    ],
  },
  {
    key: "ops-group",
    label: "运维管理",
    children: [
      { key: "/faults", icon: <AlertTriangle className="w-4 h-4" />, label: "故障上报" },
      { key: "/data-reporting", icon: <FileSpreadsheet className="w-4 h-4" />, label: "数据填报" },
      { key: "/knowledge", icon: <Search className="w-4 h-4" />, label: "知识库" },
    ],
  },
  {
    key: "sys-group",
    label: "系统",
    children: [
      { key: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" />, label: "可视化大屏" },
      { key: "/statistics", icon: <BarChart className="w-4 h-4" />, label: "统计分析" },
      { key: "/integrations", icon: <Plug className="w-4 h-4" />, label: "系统对接" },
      { key: "/class-boards", icon: <Monitor className="w-4 h-4" />, label: "电子班牌" },
      { key: "/users", icon: <UserCog className="w-4 h-4" />, label: "用户管理" },
      { key: "/payments", icon: <CreditCard className="w-4 h-4" />, label: "收费管理" },
      { key: "/mobile/dashboard", icon: <Smartphone className="w-4 h-4" />, label: "移动端" },
    ],
  },
];

/**
 * 100% Brand-new Written AppShell Navigation Frame (Zero AntD Layout/Menu dependency)
 * Built with full responsive support, canvas-aligned background `#F8FAFC`, right border separator,
 * custom avatar trigger dropdowns, and highly dense Linear/Stripe layout metadata ratios.
 */
export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isFullWidth = location.pathname.startsWith("/dashboard");
  const meta = getRouteMeta(location.pathname);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="flex h-screen w-full bg-[var(--canvas)] text-[var(--ink-primary)] overflow-hidden font-sans">
      
      {/* Pristine Sidebar (Zero AntD) */}
      <aside 
        className="h-full bg-[var(--canvas)] border-r border-[var(--border-default)] flex flex-col transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)] select-none shrink-0"
        style={{ width: collapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-width)" }}
      >
        {/* Brand Logo Header */}
        <div className="h-[var(--header-height)] border-b border-[var(--border-subtle)] px-4 flex items-center gap-2.5 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 bg-[var(--brand)] text-white rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] shrink-0">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 22H22L12 2Z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </div>
          {!collapsed && (
            <span className="text-[13px] font-semibold tracking-tight truncate text-[var(--ink-primary)]">
              LabOS 实验管理
            </span>
          )}
        </div>

        {/* Scrollable Sidebar Items */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin">
          {MENU_ITEMS.map((group) => (
            <div key={group.key} className="space-y-1">
              {!collapsed && (
                <span className="block px-3 text-[10px] font-bold text-[var(--ink-tertiary)] uppercase tracking-wider mb-1.5 select-none">
                  {group.label}
                </span>
              )}
              <div className="space-y-0.5">
                {group.children.map((item) => {
                  const isActive = location.pathname === item.key || location.pathname.startsWith(`${item.key}/`);
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleNavigation(item.key)}
                      className="w-full flex items-center gap-3 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-all cursor-pointer group"
                      style={{
                        backgroundColor: isActive ? "var(--brand-subtle)" : "transparent",
                        color: isActive ? "var(--brand)" : "var(--ink-secondary)",
                      }}
                    >
                      <div className="shrink-0 transition-colors group-hover:text-[var(--ink-primary)]">
                        {item.icon}
                      </div>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer with collapse trigger */}
        <div className="p-2 border-t border-[var(--border-subtle)] shrink-0 flex justify-end">
          <button 
            onClick={toggleSidebar}
            className="p-1.5 text-[var(--ink-tertiary)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface-inset)] rounded-[var(--radius-sm)] cursor-pointer transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* Sticky Header */}
        <header className="h-[var(--header-height)] bg-[var(--surface)] border-b border-[var(--border-default)] px-4 flex items-center justify-between shrink-0 sticky top-0 z-40 select-none shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-tight text-[var(--ink-primary)]">
              {meta.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* User Dropdown Control (Stripe style profile popover) */}
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-[var(--radius-sm)] hover:bg-[var(--surface-inset)] transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-xs font-semibold uppercase">
                  {user?.name?.charAt(0) ?? "U"}
                </div>
                <span className="hidden md:block text-xs font-medium text-[var(--ink-secondary)] pr-1">{user?.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-48 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] py-1 z-50 animate-scale-in">
                    <div className="px-3.5 py-1.5 border-b border-[var(--border-subtle)] select-none">
                      <div className="text-xs font-semibold text-[var(--ink-primary)] truncate">{user?.name}</div>
                      <div className="text-[10px] text-[var(--ink-tertiary)] truncate mt-0.5">{user?.role}</div>
                    </div>
                    <button 
                      onClick={() => { setDropdownOpen(false); logout(); }}
                      className="w-full inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content canvas (Stripe content full fluid view specs) */}
        <main className="flex-1 overflow-y-auto">
          <div className={`w-full mx-auto ${isFullWidth ? "p-0" : "p-4 md:p-6"}`}>
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
}
