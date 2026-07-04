export type LabType = "teaching" | "research" | "comprehensive" | "innovation" | "training";
export type OpenStatus = "open" | "closed" | "maintenance";
export type InspectionStatus = "normal" | "pending" | "issue";

export interface Lab {
  id: string;
  code: string;
  name: string;
  room_id?: string;
  location_detail?: string;
  area_sqm?: number;
  functional_zones?: string[];
  capacity?: number;
  lab_type?: LabType;
  manager_id?: string;
  open_status: OpenStatus;
  inspection_status: InspectionStatus;
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  building_name?: string;
  floor_name?: string;
  room_name?: string;
}

export interface LabListResponse {
  items: Lab[];
  total: number;
  page: number;
  page_size: number;
}

export interface LabCreate {
  name: string;
  room_id?: string;
  location_detail?: string;
  area_sqm?: number;
  functional_zones?: string[];
  capacity?: number;
  lab_type?: LabType;
  manager_id?: string;
  open_status?: OpenStatus;
  description?: string;
}

export const LAB_TYPE_LABELS: Record<LabType, string> = {
  teaching: "教学实验室",
  research: "科研实验室",
  comprehensive: "综合实验室",
  innovation: "创新实验室",
  training: "实训中心",
};

export const OPEN_STATUS_LABELS: Record<OpenStatus, string> = {
  open: "开放",
  closed: "关闭",
  maintenance: "维护中",
};

export const OPEN_STATUS_COLORS: Record<OpenStatus, string> = {
  open: "success",
  closed: "default",
  maintenance: "warning",
};

export interface BuildingTree {
  id: string;
  name: string;
  code: string;
  floors: Array<{
    id: string;
    name: string;
    floor_number: number;
    rooms: Array<{ id: string; name: string; code?: string }>;
  }>;
}
