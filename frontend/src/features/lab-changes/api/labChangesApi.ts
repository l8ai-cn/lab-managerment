import { api } from "@/shared/api/client";

export type ChangeType =
  | "function_adjustment"
  | "manager_change"
  | "equipment_change"
  | "zone_adjustment";

export type ChangeStatus =
  | "draft"
  | "pending_unit"
  | "pending_center"
  | "approved"
  | "rejected";

export interface ChangeRequest {
  id: string;
  lab_id: string;
  lab_name?: string;
  lab_code?: string;
  applicant_id: string;
  applicant_name?: string;
  change_type: ChangeType;
  title: string;
  description?: string;
  change_content: Record<string, unknown>;
  status: ChangeStatus;
  approval_records: Array<{
    id: string;
    approver_name?: string;
    node: string;
    action: string;
    comment?: string;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  function_adjustment: "功能调整",
  manager_change: "负责人变更",
  equipment_change: "设备增减",
  zone_adjustment: "区域划分调整",
};

export const CHANGE_STATUS_LABELS: Record<ChangeStatus, string> = {
  draft: "草稿",
  pending_unit: "待单位审核",
  pending_center: "待管理中心审核",
  approved: "已通过",
  rejected: "已驳回",
};

export const CHANGE_STATUS_COLORS: Record<ChangeStatus, string> = {
  draft: "default",
  pending_unit: "processing",
  pending_center: "processing",
  approved: "success",
  rejected: "error",
};

export const labChangesApi = {
  list: (params: { page?: number; status?: ChangeStatus; lab_id?: string } = {}) =>
    api.get<{ items: ChangeRequest[]; total: number }>("/lab-changes", { params }).then((r) => r.data),

  get: (id: string) => api.get<ChangeRequest>(`/lab-changes/${id}`).then((r) => r.data),

  create: (data: {
    lab_id: string;
    change_type: ChangeType;
    title: string;
    description?: string;
    change_content?: Record<string, unknown>;
  }) => api.post<ChangeRequest>("/lab-changes", data).then((r) => r.data),

  submit: (id: string) => api.post<ChangeRequest>(`/lab-changes/${id}/submit`).then((r) => r.data),

  approve: (id: string, comment?: string) =>
    api.post<ChangeRequest>(`/lab-changes/${id}/approve`, { comment }).then((r) => r.data),

  reject: (id: string, comment: string) =>
    api.post<ChangeRequest>(`/lab-changes/${id}/reject`, { comment }).then((r) => r.data),
};
