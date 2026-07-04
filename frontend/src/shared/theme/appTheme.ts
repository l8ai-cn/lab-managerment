import type { ThemeConfig } from "antd";

/**
 * LabOS Precision Design Token Specification (v1.0)
 * 
 * Inspired by Google Material Design 3 (Enterprise Grid) and Verily Precision Health Design Language.
 * 
 * Key Principles Applied:
 * - "Content-First Typography": High-contrast scales, optimal reading rhythm (letter-spacing -0.01em on headers).
 * - "Zero-Gravity Elevational Hierarchy": Replace aggressive physical shadows with pure 1px structural division (Slate-200) and soft 2-layer micro-ambient shadows.
 * - "Chroma Precision": 
 *   - Primary Blue (#0252D9): Professional authority, high-density focus (compliance, security & health workflows).
 *   - Success Green (#00A870): Clinical/operational safety indicator (regulatory safety score & audit-ready status).
 *   - Neutral Slate (#0F172A to #F8FAFC): Clean, high-performance dashboard layout logic.
 * - "Tactile Density": Sub-pixel precision line heights, 6px-8px compact geometric radius (reducing recreational bubble aesthetic).
 */
export const appTheme: ThemeConfig = {
  token: {
    // === Seed Tokens (Design Intent) ===
    colorPrimary: "#0252D9",      // Verily-inspired High-density Enterprise Blue
    colorInfo: "#2563EB",         // Semantic Informational Blue
    colorSuccess: "#00A870",      // Precision Health indicator green
    colorWarning: "#D97706",      // Warm Amber warning state
    colorError: "#E1251B",        // Urgent alarm crimson

    // === Typography ===
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    fontSize: 14,
    lineHeight: 1.5,

    // === Sizing & Shapes (Verily Atomic Compact Specification) ===
    borderRadius: 6,              // Strict, sharp enterprise geometric radius
    borderRadiusLG: 8,            // Container/Modal major outer radius
    borderRadiusSM: 4,            // Inner control/Badge micro radius

    // === Backgrounds & Borders ===
    colorBgLayout: "#F8FAFC",     // Light, low-fatigue slate-white workspace
    colorBgContainer: "#FFFFFF",  // Paper-white cards
    colorBorder: "#E2E8F0",       // Slate-200 exact divider boundaries
    colorBorderSecondary: "#F1F5F9", // Slate-100 micro line-height separations

    // === Elevated Hierarchy Shadows ===
    boxShadowSecondary: "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 2px 8px -1px rgba(0, 0, 0, 0.04)",
  },
  components: {
    Layout: {
      siderBg: "#0F172A",         // Strict deep slate navigation sidebar
      headerBg: "#FFFFFF",
      bodyBg: "#F8FAFC",
      triggerBg: "#1E293B",
    },
    Menu: {
      darkItemBg: "transparent",
      darkSubMenuItemBg: "transparent",
      darkItemSelectedBg: "rgba(2, 82, 217, 0.08)",
      darkItemHoverBg: "rgba(148, 163, 184, 0.06)",
      darkItemSelectedColor: "#3B82F6",
      itemBorderRadius: 4,
      itemMarginInline: 8,
      itemHeight: 40,
    },
    Table: {
      headerBg: "#F8FAFC",        // Highly focusable header fill
      headerColor: "#334155",     // Slate-700 prominent text
      rowHoverBg: "#F0F7FF",      // Pure micro-translucent highlight
      borderColor: "#E2E8F0",
      padding: 12,                // High-density spreadsheet grid margins
    },
    Card: {
      paddingLG: 20,
    },
    Button: {
      primaryShadow: "none",      // Flat interactive design (Material M3 compliant)
      controlHeightLG: 40,
      controlHeight: 34,
      controlHeightSM: 28,
    },
    Input: {
      activeBorderColor: "#0252D9",
      hoverBorderColor: "#94A3B8",
      controlHeightLG: 40,
      controlHeight: 34,
    },
    Select: {
      activeBorderColor: "#0252D9",
      hoverBorderColor: "#94A3B8",
      controlHeightLG: 40,
      controlHeight: 34,
    },
    Tag: {
      borderRadiusSM: 4,
    },
    Tabs: {
      titleFontSize: 14,
      horizontalMargin: "0 0 16px 0",
    },
  },
};
