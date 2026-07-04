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

export interface FaultStats {
  by_type: Record<string, number>;
  by_lab: Record<string, number>;
  by_status: Record<string, number>;
}

export interface ExperimentProjectStats {
  total_projects: number;
  total_courses: number;
  by_type: Record<string, number>;
  by_semester: Record<string, number>;
}

export interface StatisticsParams {
  lab_id?: string;
  category?: string;
  from_time?: string;
  to_time?: string;
}

export interface EquipmentValueStats {
  total_value: number;
  by_lab: Record<string, number>;
  by_category: Record<string, number>;
  instrument_count: number;
}

export const statisticsApi = {
  overview: () => api.get<OverviewStats>("/statistics/overview").then((r) => r.data),

  instrumentUsage: (params: StatisticsParams = {}) =>
    api.get<InstrumentUsageStats>("/statistics/instrument-usage", { params }).then((r) => r.data),

  labUsage: (params: StatisticsParams = {}) =>
    api.get<LabUsageStats>("/statistics/lab-usage", { params }).then((r) => r.data),

  faults: (params: { lab_id?: string } = {}) =>
    api.get<FaultStats>("/statistics/faults", { params }).then((r) => r.data),

  experimentProjects: () =>
    api.get<ExperimentProjectStats>("/statistics/experiment-projects").then((r) => r.data),

  equipmentValue: () =>
    api.get<EquipmentValueStats>("/statistics/equipment-value").then((r) => r.data),

  exportReport: (exportType: "overview" | "equipment-value" | "faults") =>
    api
      .get(`/statistics/export/${exportType}`, { responseType: "blob" })
      .then((r) => r.data as Blob),
};
