import { api } from "@/shared/api/client";

export type IntegrationType = "asset" | "card" | "access" | "face" | "payment";
export type SyncStatus = "success" | "failed" | "partial" | "never_synced";

export const INTEGRATION_TYPE_LABELS: Record<IntegrationType, string> = {
  asset: "资产系统",
  card: "一卡通",
  access: "门禁系统",
  face: "人脸识别",
  payment: "支付系统",
};

export const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  success: "成功",
  failed: "失败",
  partial: "部分成功",
  never_synced: "未同步",
};

export const SYNC_STATUS_COLORS: Record<SyncStatus, string> = {
  success: "green",
  failed: "red",
  partial: "orange",
  never_synced: "default",
};

export interface SyncTriggerResponse {
  integration_type: IntegrationType;
  status: SyncStatus;
  synced_count: number;
  message: string;
}

export interface IntegrationStatusItem {
  type: string;
  status: SyncStatus;
  synced_count?: number;
  last_synced_at?: string | null;
  message?: string | null;
  config?: Record<string, unknown>;
}

export interface IntegrationStatusResponse {
  integrations: IntegrationStatusItem[];
}

export const integrationsApi = {
  triggerSync: (type: IntegrationType) =>
    api.post<SyncTriggerResponse>(`/integrations/sync/${type}`).then((r) => r.data),

  getStatus: () =>
    api.get<IntegrationStatusResponse>("/integrations/status").then((r) => r.data),

  getConfig: () =>
    api.get<{ integrations: IntegrationStatusItem[] }>("/integrations/config").then((r) => r.data),
};
