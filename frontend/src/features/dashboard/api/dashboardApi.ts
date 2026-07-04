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

export const dashboardApi = {
  overview: () => api.get<DashboardOverview>("/dashboard/overview").then((r) => r.data),

  trends: () => api.get<DashboardTrends>("/dashboard/trends").then((r) => r.data),
};
