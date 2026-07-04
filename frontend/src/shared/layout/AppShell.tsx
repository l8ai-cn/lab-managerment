import {
  ApiOutlined,
  BankOutlined,
  BarChartOutlined,
  BookOutlined,
  CalendarOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  FormOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  ToolOutlined,
  WarningOutlined,
  ApartmentOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown, Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { CopilotSidebar } from "@copilotkit/react-core/v2";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { LabCopilotActions } from "@/features/copilot/LabCopilotActions";
import { useAuth } from "@/shared/auth/AuthContext";
import { getRouteMeta } from "@/shared/layout/routeMeta";
import "./AppShell.css";

const { Header, Sider, Content } = Layout;

const ROLE_LABELS: Record<string, string> = {
  system_admin: "系统管理员",
  dept_admin: "院系管理员",
  lab_admin: "实验室管理员",
  teacher: "教师",
  student: "学生",
  guest: "临时人员",
};

const MENU_ITEMS: MenuProps["items"] = [
  {
    key: "lab-group",
    label: "实验室管理",
    type: "group",
    children: [
      { key: "/labs", icon: <HomeOutlined />, label: "实验室" },
      { key: "/spaces", icon: <ApartmentOutlined />, label: "空间管理" },
      { key: "/lab-staff", icon: <TeamOutlined />, label: "实验员" },
      { key: "/lab-changes", icon: <FormOutlined />, label: "变更管理" },
    ],
  },
  {
    key: "booking-group",
    label: "设备与预约",
    type: "group",
    children: [
      { key: "/instruments", icon: <ToolOutlined />, label: "仪器台账" },
      { key: "/instrument-bookings", icon: <CalendarOutlined />, label: "仪器预约" },
      { key: "/lab-bookings", icon: <BookOutlined />, label: "实验室预约" },
    ],
  },
  {
    key: "research-group",
    label: "教学科研",
    type: "group",
    children: [
      { key: "/experiment-projects", icon: <ExperimentOutlined />, label: "实验项目" },
      { key: "/experiments", icon: <BarChartOutlined />, label: "科研实验" },
    ],
  },
  {
    key: "ops-group",
    label: "运维管理",
    type: "group",
    children: [
      { key: "/faults", icon: <WarningOutlined />, label: "故障上报" },
      { key: "/data-reporting", icon: <FormOutlined />, label: "数据填报" },
    ],
  },
  {
    key: "sys-group",
    label: "系统",
    type: "group",
    children: [
      { key: "/dashboard", icon: <DashboardOutlined />, label: "可视化大屏" },
      { key: "/statistics", icon: <BarChartOutlined />, label: "统计分析" },
      { key: "/integrations", icon: <ApiOutlined />, label: "系统对接" },
      { key: "/users", icon: <UserOutlined />, label: "用户管理" },
      { key: "/payments", icon: <BankOutlined />, label: "收费管理" },
    ],
  },
];

const ROUTE_KEYS = [
  "/labs", "/spaces", "/lab-staff", "/lab-changes",
  "/instruments", "/instrument-bookings", "/lab-bookings",
  "/experiment-projects", "/experiments",
  "/faults", "/data-reporting",
  "/dashboard", "/statistics", "/integrations", "/users", "/payments",
];

function findSelectedKey(pathname: string): string {
  return ROUTE_KEYS.find((key) => pathname === key || pathname.startsWith(`${key}/`)) ?? "/dashboard";
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const selectedKey = findSelectedKey(location.pathname);
  const isFullWidth = location.pathname.startsWith("/dashboard");
  const pageMeta = getRouteMeta(location.pathname);

  const userMenuItems: MenuProps["items"] = [
    { key: "role", label: ROLE_LABELS[user?.role ?? ""] ?? user?.role, disabled: true },
    { type: "divider" },
    { key: "logout", label: "退出登录", danger: true, onClick: logout },
  ];

  return (
    <>
      <LabCopilotActions />
      <Layout className="app-shell">
      <Sider
        className="app-shell__sider"
        width={240}
        collapsedWidth={72}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        theme="dark"
      >
        <div className="app-shell__logo">
          <div className="app-shell__logo-icon">
            <ExperimentOutlined />
          </div>
          {!collapsed && <span className="app-shell__logo-text">LabOS 实验室管理</span>}
        </div>
        <Menu
          className="app-shell__menu"
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={MENU_ITEMS}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Header className="app-shell__header">
          <div className="app-shell__header-left">
            <span className="app-shell__trigger" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <span className="app-shell__page-title">{pageMeta.title}</span>
          </div>

          <div className="app-shell__header-right">
            <div className="app-shell__notif-btn">
              <NotificationBell />
            </div>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="app-shell__user">
                <Avatar size={36} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
                  {user?.name?.charAt(0) ?? "U"}
                </Avatar>
                <span className="app-shell__user-name">{user?.name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          className={`app-shell__content ${isFullWidth ? "app-shell__content--full" : "app-shell__content--default"}`}
        >
          <div className="app-shell__content-inner">
            <Outlet />
          </div>
        </Content>
      </Layout>
      </Layout>
      <CopilotSidebar
        agentId="default"
        defaultOpen={false}
        labels={{
          modalHeaderTitle: "LabOS 智能助手",
          welcomeMessageText: "你好，我是 LabOS 实验室管理助手。可以帮你查询实验室、仪器、预约和故障信息，或跳转到相关页面。",
          chatInputPlaceholder: "输入问题，例如：列出所有实验室",
        }}
      />
    </>
  );
}
