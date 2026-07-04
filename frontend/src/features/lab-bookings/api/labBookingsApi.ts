import { api } from "@/shared/api/client";

export type UsageType = "teaching" | "research" | "open" | "competition" | "service";
export type LabBookingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "completed";
export type CheckInMethod = "card" | "qr" | "face";
export type UsageReviewStatus = "pending" | "approved" | "rejected";

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

export const CHECK_IN_METHOD_LABELS: Record<CheckInMethod, string> = {
  card: "刷卡",
  qr: "扫码",
  face: "人脸",
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
  recurrence_rule?: Record<string, unknown> | null;
  created_at: string;
}

export interface LabBookingCreate {
  lab_id: string;
  start_time: string;
  end_time: string;
  usage_type: UsageType;
  purpose: string;
  expected_count?: number;
  is_recurring?: boolean;
  recurrence_rule?: Record<string, unknown> | null;
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
  usage_type_rules?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface BookingRuleCreate {
  lab_id: string;
  open_hours?: Record<string, unknown>;
  allowed_roles?: string[];
  daily_limit?: number;
  usage_type_rules?: Record<string, unknown>;
}

export interface BookingRuleUpdate {
  open_hours?: Record<string, unknown>;
  allowed_roles?: string[];
  daily_limit?: number;
  usage_type_rules?: Record<string, unknown>;
}

export interface AccessGrant {
  id: string;
  booking_id: string;
  access_method: string;
  access_token: string;
  expires_at: string;
  created_at: string;
}

export interface CheckInResponse {
  id: string;
  booking_id: string;
  method: CheckInMethod;
  actual_count?: number;
  checked_in_at: string;
}

export interface UsageRecord {
  id: string;
  booking_id: string;
  content?: string;
  parameters?: Record<string, unknown>;
  consumables?: Record<string, unknown>;
  attachments?: unknown[];
  review_status: UsageReviewStatus;
  reviewer_comment?: string;
  created_at: string;
}

export interface UsageRecordCreate {
  content?: string;
  parameters?: Record<string, unknown>;
  consumables?: Record<string, unknown>;
  attachments?: unknown[];
}

export interface PendingUsageItem {
  booking_id: string;
  lab_id: string;
  lab_name?: string;
  content?: string;
  review_status: UsageReviewStatus;
  created_at: string;
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

  get: (id: string) => api.get<LabBooking>(`/lab-bookings/${id}`).then((r) => r.data),

  create: (data: LabBookingCreate) =>
    api.post<LabBooking>("/lab-bookings", data).then((r) => r.data),

  approve: (id: string, comment?: string) =>
    api.post<LabBooking>(`/lab-bookings/${id}/approve`, { comment }).then((r) => r.data),

  reject: (id: string, comment: string) =>
    api.post<LabBooking>(`/lab-bookings/${id}/reject`, { comment }).then((r) => r.data),

  cancel: (id: string) =>
    api.post<LabBooking>(`/lab-bookings/${id}/cancel`).then((r) => r.data),

  checkIn: (id: string, data: { method: CheckInMethod; actual_count?: number }) =>
    api.post<CheckInResponse>(`/lab-bookings/${id}/check-in`, data).then((r) => r.data),

  submitUsage: (id: string, data: UsageRecordCreate) =>
    api.post<UsageRecord>(`/lab-bookings/${id}/usage`, data).then((r) => r.data),

  approveUsage: (id: string, comment?: string) =>
    api.post<UsageRecord>(`/lab-bookings/${id}/usage/approve`, { comment }).then((r) => r.data),

  rejectUsage: (id: string, comment: string) =>
    api.post<UsageRecord>(`/lab-bookings/${id}/usage/reject`, { comment }).then((r) => r.data),

  listPendingUsage: () =>
    api.get<{ items: PendingUsageItem[]; total: number }>("/lab-bookings/usage/pending").then((r) => r.data),

  batchReviewUsage: (bookingIds: string[], approve: boolean, comment?: string) =>
    api
      .post<{ processed: number; failed: string[] }>("/lab-bookings/usage/batch-review", {
        booking_ids: bookingIds,
        approve,
        comment,
      })
      .then((r) => r.data),

  getAccessGrants: (bookingId: string) =>
    api.get<AccessGrant[]>(`/lab-bookings/${bookingId}/access-grants`).then((r) => r.data),

  exportBookings: (params: { lab_id?: string; status?: LabBookingStatus; from_time?: string; to_time?: string } = {}) =>
    api
      .get("/lab-bookings/export", { params, responseType: "blob" })
      .then((r) => r.data as Blob),

  calendar: (labId: string, fromTime: string, toTime: string) =>
    api
      .get<Array<{ start_time: string; end_time: string; status: string; usage_type?: string }>>(
        "/lab-bookings/calendar",
        { params: { lab_id: labId, from_time: fromTime, to_time: toTime } },
      )
      .then((r) => r.data),
};

export const labBookingRulesApi = {
  get: (labId: string) =>
    api.get<BookingRule>(`/lab-booking-rules/${labId}`).then((r) => r.data),

  create: (data: BookingRuleCreate) =>
    api.post<BookingRule>("/lab-booking-rules", data).then((r) => r.data),

  update: (labId: string, data: BookingRuleUpdate) =>
    api.patch<BookingRule>(`/lab-booking-rules/${labId}`, data).then((r) => r.data),

  delete: (labId: string) => api.delete(`/lab-booking-rules/${labId}`),
};
