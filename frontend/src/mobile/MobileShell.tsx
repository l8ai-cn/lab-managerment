import {
  CalendarOutlined,
  DashboardOutlined,
  HomeOutlined,
  QrcodeOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import "./MobileShell.css";

const { Header, Content } = Layout;

const TAB_ITEMS: MenuProps["items"] = [
  { key: "/mobile/dashboard", icon: <DashboardOutlined />, label: "首页" },
  { key: "/mobile/labs", icon: <HomeOutlined />, label: "实验室" },
  { key: "/mobile/bookings", icon: <CalendarOutlined />, label: "预约" },
  { key: "/mobile/faults", icon: <WarningOutlined />, label: "故障" },
  { key: "/mobile/scan", icon: <QrcodeOutlined />, label: "扫码" },
];

const TAB_KEYS = [
  "/mobile/dashboard",
  "/mobile/labs",
  "/mobile/bookings",
  "/mobile/faults",
  "/mobile/scan",
] as const;

export function MobileShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedKey =
    TAB_KEYS.find((key) => location.pathname.startsWith(key)) ?? "/mobile/dashboard";

  return (
    <Layout className="mobile-shell">
      <Header className="mobile-shell__header">
        <span className="mobile-shell__title">LabOS 移动版</span>
      </Header>
      <Content className="mobile-shell__content">
        <Outlet />
      </Content>
      <Menu
        className="mobile-shell__tabs"
        mode="horizontal"
        selectedKeys={[selectedKey as string]}
        items={TAB_ITEMS}
        onClick={({ key }) => navigate(key)}
      />
    </Layout>
  );
}
