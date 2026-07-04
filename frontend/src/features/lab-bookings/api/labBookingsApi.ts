import { api } from "@/shared/api/client";

export type UsageType = "teaching" | "research" | "open" | "competition" | "service";
export type LabBookingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "completed";

export const USAGE_TYPE_LABELS: Record<UsageType, string> = {
  teaching: "教学",
  research: "科研",
  open: "开放",
  competition: "竞赛",
  service: "社会服务",
};

export const LAB_BOOKING_STATUS_LABELS: Record<LabBookingStatus, string> = {
  pending: "待审批",
  approved: "已通过",
  rejected: "已拒绝",
  cancelled: "已取消",
  completed: "已完成",
};

export const LAB_BOOKING_STATUS_COLORS: Record<LabBookingStatus, string> = {
  pending: "orange",
  approved: "green",
  rejected: "red",
  cancelled: "default",
  completed: "blue",
};

export interface LabBooking {
  id: string;
  lab_id: string;
  lab_name?: string;
  user_id: string;
  start_time: string;
  end_time: string;
  usage_type: UsageType;
  purpose: string;
  expected_count?: number;
  status: LabBookingStatus;
  is_recurring: boolean;
  created_at: string;
}

export interface LabBookingCreate {
  lab_id: string;
  start_time: string;
  end_time: string;
  usage_type: UsageType;
  purpose: string;
  expected_count?: number;
}

export interface LabBookingListResponse {
  items: LabBooking[];
  total: number;
  page: number;
  page_size: number;
}

export interface BookingRule {
  id: string;
  lab_id: string;
  open_hours: Record<string, unknown>;
  allowed_roles?: string[];
  daily_limit?: number;
}

export interface LabBookingListParams {
  page?: number;
  page_size?: number;
  lab_id?: string;
  status?: LabBookingStatus;
}

export const labBookingsApi = {
  list: (params: LabBookingListParams = {}) =>
    api.get<LabBookingListResponse>("/lab-bookings", { params }).then((r) => r.data),

  create: (data: LabBookingCreate) =>
    api.post<LabBooking>("/lab-bookings", data).then((r) => r.data),

  approve: (id: string, comment?: string) =>
    api.post<LabBooking>(`/lab-bookings/${id}/approve`, { comment }).then((r) => r.data),

  reject: (id: string, comment: string) =>
    api.post<LabBooking>(`/lab-bookings/${id}/reject`, { comment }).then((r) => r.data),

  cancel: (id: string) =>
    api.post<LabBooking>(`/lab-bookings/${id}/cancel`).then((r) => r.data),
};

export const labBookingRulesApi = {
  get: (labId: string) =>
    api.get<BookingRule>(`/lab-booking-rules/${labId}`).then((r) => r.data),
};
