import { api } from "@/shared/api/client";

export interface OverviewStats {
  lab_count: number;
  instrument_count: number;
  booking_count: number;
  lab_booking_count: number;
  fault_count: number;
  pending_bookings: number;
  pending_faults: number;
}

export interface InstrumentUsageStats {
  by_lab: Record<string, number>;
  by_category: Record<string, number>;
  total_bookings: number;
}

export interface LabUsageStats {
  total_hours: number;
  person_times: number;
  by_usage_type: Record<string, number>;
}

export const statisticsApi = {
  overview: () => api.get<OverviewStats>("/statistics/overview").then((r) => r.data),

  instrumentUsage: () =>
    api.get<InstrumentUsageStats>("/statistics/instrument-usage").then((r) => r.data),

  labUsage: () => api.get<LabUsageStats>("/statistics/lab-usage").then((r) => r.data),
};
