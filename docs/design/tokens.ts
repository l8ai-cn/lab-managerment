/**
 * LabOS Design Tokens v1.0.0
 * Precision Campus — Linear/Stripe + OpenELIS + Cal.com
 * @see docs/design/DESIGN.md
 */

export const colors = {
  canvas: { light: "#F8FAFC", dark: "#0B0F14" },
  surface: { light: "#FFFFFF", dark: "#111827" },
  surfaceRaised: { light: "#FFFFFF", dark: "#1A2332" },
  surfaceInset: { light: "#F1F5F9", dark: "#0F172A" },

  ink: {
    primary: { light: "#0F172A", dark: "#F1F5F9" },
    secondary: { light: "#475569", dark: "#94A3B8" },
    tertiary: { light: "#64748B", dark: "#64748B" },
    muted: { light: "#94A3B8", dark: "#475569" },
  },

  brand: {
    DEFAULT: { light: "#2563EB", dark: "#3B82F6" },
    hover: { light: "#1D4ED8", dark: "#2563EB" },
    subtle: { light: "#EFF6FF", dark: "#1E3A5F" },
  },

  status: {
    ready: { DEFAULT: { light: "#059669", dark: "#34D399" }, subtle: { light: "#ECFDF5", dark: "#064E3B" } },
    pending: { DEFAULT: { light: "#2563EB", dark: "#60A5FA" }, subtle: { light: "#EFF6FF", dark: "#1E3A5F" } },
    maintenance: { DEFAULT: { light: "#D97706", dark: "#FBBF24" }, subtle: { light: "#FFFBEB", dark: "#78350F" } },
    fault: { DEFAULT: { light: "#E11D48", dark: "#FB7185" }, subtle: { light: "#FFF1F2", dark: "#881337" } },
    offline: { DEFAULT: { light: "#64748B", dark: "#94A3B8" }, subtle: { light: "#F1F5F9", dark: "#1E293B" } },
  },

  border: {
    default: { light: "rgba(15,23,42,0.08)", dark: "rgba(255,255,255,0.08)" },
    subtle: { light: "rgba(15,23,42,0.05)", dark: "rgba(255,255,255,0.05)" },
    strong: { light: "rgba(15,23,42,0.12)", dark: "rgba(255,255,255,0.12)" },
  },

  focusRing: { light: "rgba(37,99,235,0.24)", dark: "rgba(59,130,246,0.32)" },
} as const;

export const typography = {
  fontFamily: {
    sans: ['"Geist"', '"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', "sans-serif"],
    mono: ['"IBM Plex Mono"', '"Geist Mono"', '"Noto Sans Mono SC"', "monospace"],
  },
  fontSize: {
    display: ["28px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
    h1: ["22px", { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "600" }],
    h2: ["18px", { lineHeight: "1.3", fontWeight: "600" }],
    h3: ["16px", { lineHeight: "1.35", fontWeight: "600" }],
    body: ["14px", { lineHeight: "1.5", fontWeight: "400" }],
    "body-medium": ["14px", { lineHeight: "1.5", fontWeight: "500" }],
    label: ["12px", { lineHeight: "1.4", letterSpacing: "0.02em", fontWeight: "500" }],
    caption: ["11px", { lineHeight: "1.4", letterSpacing: "0.04em", fontWeight: "500" }],
    metric: ["28px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "600" }],
  },
} as const;

export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  12: "48px",
  16: "64px",
} as const;

export const radius = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  full: "9999px",
} as const;

export const layout = {
  sidebarWidth: "260px",
  sidebarCollapsed: "72px",
  headerHeight: "56px",
  contentPadding: "24px",
  tableRowHeight: "44px",
  tableHeaderHeight: "40px",
} as const;

export const motion = {
  duration: {
    instant: "100ms",
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
  },
  easing: {
    out: "cubic-bezier(0.23, 1, 0.32, 1)",
    inOut: "cubic-bezier(0.77, 0, 0.175, 1)",
  },
} as const;

/** Instrument Status Rail — LabOS signature element */
export const statusRail = {
  width: "3px",
  map: {
    ready: colors.status.ready.DEFAULT.light,
    pending: colors.status.pending.DEFAULT.light,
    maintenance: colors.status.maintenance.DEFAULT.light,
    fault: colors.status.fault.DEFAULT.light,
    offline: colors.status.offline.DEFAULT.light,
  },
} as const;

export const shadcnTheme = {
  background: "var(--canvas)",
  foreground: "var(--ink-primary)",
  card: "var(--surface)",
  cardForeground: "var(--ink-primary)",
  primary: "var(--brand)",
  primaryForeground: "#FFFFFF",
  secondary: "var(--surface-inset)",
  muted: "var(--surface-inset)",
  mutedForeground: "var(--ink-tertiary)",
  accent: "var(--brand-subtle)",
  destructive: "var(--status-fault)",
  border: "var(--border-default)",
  input: "var(--border-default)",
  ring: "var(--focus-ring)",
  radius: "6px",
} as const;

export default { colors, typography, spacing, radius, layout, motion, statusRail, shadcnTheme };
