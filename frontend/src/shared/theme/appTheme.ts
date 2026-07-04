import type { ThemeConfig } from "antd";

export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: "#0ea5e9",
    colorInfo: "#6366f1",
    colorSuccess: "#10b981",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    borderRadius: 10,
    borderRadiusLG: 14,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    colorBgLayout: "#f1f5f9",
    colorBgContainer: "#ffffff",
    boxShadowSecondary:
      "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.06)",
  },
  components: {
    Layout: {
      siderBg: "#0f172a",
      headerBg: "#ffffff",
      bodyBg: "#f1f5f9",
      triggerBg: "#1e293b",
    },
    Menu: {
      darkItemBg: "transparent",
      darkSubMenuItemBg: "transparent",
      darkItemSelectedBg: "rgba(14, 165, 233, 0.15)",
      darkItemHoverBg: "rgba(148, 163, 184, 0.12)",
      darkItemSelectedColor: "#38bdf8",
      itemBorderRadius: 8,
      itemMarginInline: 8,
      itemHeight: 40,
    },
    Table: {
      headerBg: "#f8fafc",
      headerColor: "#475569",
      rowHoverBg: "#f0f9ff",
      borderColor: "#e2e8f0",
    },
    Card: {
      paddingLG: 20,
    },
    Button: {
      primaryShadow: "0 2px 8px rgba(14, 165, 233, 0.25)",
    },
  },
};
