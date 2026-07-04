export type ExperimentStatus =
  | "draft"
  | "planned"
  | "in_progress"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled"
  | "archived";

export interface Experiment {
  id: string;
  code: string;
  title: string;
  description?: string;
  hypothesis?: string;
  status: ExperimentStatus;
  owner_id?: string;
  protocol_id?: string;
  project_id?: string;
  metadata?: Record<string, unknown>;
  planned_start?: string;
  planned_end?: string;
  actual_start?: string;
  actual_end?: string;
  created_at: string;
  updated_at: string;
}

export interface ExperimentListResponse {
  items: Experiment[];
  total: number;
  page: number;
  page_size: number;
}

export interface ExperimentCreate {
  title: string;
  description?: string;
  hypothesis?: string;
  owner_id?: string;
  protocol_id?: string;
  project_id?: string;
  metadata?: Record<string, unknown>;
  planned_start?: string;
  planned_end?: string;
}

export const STATUS_LABELS: Record<ExperimentStatus, string> = {
  draft: "草稿",
  planned: "已计划",
  in_progress: "执行中",
  paused: "已暂停",
  completed: "已完成",
  failed: "失败",
  cancelled: "已取消",
  archived: "已归档",
};

export const STATUS_COLORS: Record<ExperimentStatus, string> = {
  draft: "default",
  planned: "blue",
  in_progress: "processing",
  paused: "warning",
  completed: "success",
  failed: "error",
  cancelled: "default",
  archived: "default",
};
