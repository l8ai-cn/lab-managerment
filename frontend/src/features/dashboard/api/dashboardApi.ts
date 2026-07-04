import { api } from "@/shared/api/client";

export interface DashboardOverview {
  total_labs: number;
  open_labs: number;
  total_instruments: number;
  today_bookings: number;
  active_bookings: number;
  pending_faults: number;
  online_users_estimate: number;
}

export interface TrendPoint {
  date: string;
  bookings: number;
  faults: number;
  usage_hours: number;
}

export interface DashboardTrends {
  weekly: TrendPoint[];
}

export interface SafetySummary {
  pending_faults: number;
  processing_faults: number;
  resolved_faults: number;
  safety_score: number;
}

export interface AssetValueSummary {
  total_value: number;
  instrument_count: number;
  by_category: Record<string, number>;
}

export const dashboardApi = {
  overview: () => api.get<DashboardOverview>("/dashboard/overview").then((r) => r.data),

  trends: () => api.get<DashboardTrends>("/dashboard/trends").then((r) => r.data),

  safety: () => api.get<SafetySummary>("/dashboard/safety").then((r) => r.data),

  assetValue: () => api.get<AssetValueSummary>("/dashboard/asset-value").then((r) => r.data),
};
