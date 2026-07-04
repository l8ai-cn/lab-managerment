import { api } from "@/shared/api/client";

export type FaultStatus =
  | "pending"
  | "assigned"
  | "processing"
  | "resolved"
  | "closed";

export const FAULT_STATUS_LABELS: Record<FaultStatus, string> = {
  pending: "待处理",
  assigned: "已指派",
  processing: "处理中",
  resolved: "已解决",
  closed: "已关闭",
};

export const FAULT_STATUS_COLORS: Record<FaultStatus, string> = {
  pending: "orange",
  assigned: "blue",
  processing: "cyan",
  resolved: "green",
  closed: "default",
};

export interface FaultReport {
  id: string;
  lab_id: string;
  lab_name?: string;
  reporter_id: string;
  fault_type: string;
  description: string;
  status: FaultStatus;
  assignee_id?: string;
  attachments?: unknown[];
  created_at: string;
  updated_at: string;
}

export interface FaultAttachment {
  url: string;
  filename: string;
}

export interface FaultReportCreate {
  lab_id: string;
  fault_type: string;
  description: string;
  attachments?: FaultAttachment[];
}

export interface FaultReportListResponse {
  items: FaultReport[];
  total: number;
  page: number;
  page_size: number;
}

export interface FaultStats {
  total: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  by_lab: Record<string, number>;
  avg_response_hours?: number | null;
  avg_resolution_hours?: number | null;
  resolved_count?: number;
  sla_within_24h?: number;
  sla_within_72h?: number;
}

export interface FaultListParams {
  page?: number;
  page_size?: number;
  lab_id?: string;
  status?: FaultStatus;
  fault_type?: string;
}

export const faultsApi = {
  list: (params: FaultListParams = {}) =>
    api.get<FaultReportListResponse>("/faults", { params }).then((r) => r.data),

  get: (id: string) => api.get<FaultReport>(`/faults/${id}`).then((r) => r.data),

  create: (data: FaultReportCreate) =>
    api.post<FaultReport>("/faults", data).then((r) => r.data),

  update: (id: string, data: { attachments?: FaultAttachment[] }) =>
    api.patch<FaultReport>(`/faults/${id}`, data).then((r) => r.data),

  stats: () => api.get<FaultStats>("/faults/stats").then((r) => r.data),

  assign: (id: string, assignee_id: string) =>
    api.post<FaultReport>(`/faults/${id}/assign`, { assignee_id }).then((r) => r.data),

  updateStatus: (id: string, status: FaultStatus) =>
    api.post<FaultReport>(`/faults/${id}/status`, { status }).then((r) => r.data),

  handle: (id: string, action: string, comment?: string) =>
    api
      .post(`/faults/${id}/handle`, { action, comment })
      .then((r) => r.data),

  delete: (id: string) => api.delete(`/faults/${id}`),

  getLabQr: (labId: string) =>
    api.get<{ lab_id: string; qr_token: string; url: string }>(`/labs/${labId}/fault-qr`).then((r) => r.data),
};
