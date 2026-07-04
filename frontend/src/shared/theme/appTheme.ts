import type { ThemeConfig } from "antd";

export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: "#0252D9",
    colorInfo: "#2563EB",
    colorSuccess: "#00A870",
    colorWarning: "#D97706",
    colorError: "#E1251B",
    borderRadius: 6,
    borderRadiusLG: 8,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    colorBgLayout: "#f5f7fa",
    colorBgContainer: "#ffffff",
    boxShadowSecondary:
      "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
  },
  components: {
    Layout: {
      siderBg: "#0f172a",
      headerBg: "#ffffff",
      bodyBg: "#f5f7fa",
      triggerBg: "#1e293b",
    },
    Menu: {
      darkItemBg: "transparent",
      darkSubMenuItemBg: "transparent",
      darkItemSelectedBg: "rgba(2, 82, 217, 0.1)",
      darkItemHoverBg: "rgba(148, 163, 184, 0.08)",
      darkItemSelectedColor: "#3b82f6",
      itemBorderRadius: 4,
      itemMarginInline: 8,
      itemHeight: 40,
    },
    Table: {
      headerBg: "#f8fafc",
      headerColor: "#334155",
      rowHoverBg: "#f0f7ff",
      borderColor: "#e2e8f0",
    },
    Card: {
      paddingLG: 20,
    },
    Button: {
      primaryShadow: "none",
    },
  },
};
