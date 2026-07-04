import { api } from "@/shared/api/client";

export type InstrumentStatus = "normal" | "maintenance" | "disabled" | "scrapped";
export type BookingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "completed"
  | "in_use";

export const INSTRUMENT_STATUS_LABELS: Record<InstrumentStatus, string> = {
  normal: "正常",
  maintenance: "维护中",
  disabled: "停用",
  scrapped: "报废",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "待审批",
  approved: "已通过",
  rejected: "已拒绝",
  cancelled: "已取消",
  completed: "已完成",
  in_use: "使用中",
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  pending: "orange",
  approved: "green",
  rejected: "red",
  cancelled: "default",
  completed: "blue",
  in_use: "cyan",
};

export interface Instrument {
  id: string;
  code: string;
  name: string;
  model?: string;
  manufacturer?: string;
  serial_no?: string;
  asset_no?: string;
  category?: string;
  lab_id?: string;
  lab_name?: string;
  location?: string;
  status: InstrumentStatus;
  created_at: string;
  updated_at: string;
}

export interface InstrumentCreate {
  name: string;
  model?: string;
  manufacturer?: string;
  serial_no?: string;
  asset_no?: string;
  category?: string;
  lab_id?: string;
  location?: string;
}

export interface InstrumentListResponse {
  items: Instrument[];
  total: number;
  page: number;
  page_size: number;
}

export interface InstrumentBooking {
  id: string;
  instrument_id: string;
  instrument_name?: string;
  user_id: string;
  start_time: string;
  end_time: string;
  purpose: string;
  project_name?: string;
  status: BookingStatus;
  created_at: string;
}

export interface InstrumentBookingCreate {
  instrument_id: string;
  start_time: string;
  end_time: string;
  purpose: string;
  project_name?: string;
}

export interface BookingListResponse {
  items: InstrumentBooking[];
  total: number;
  page: number;
  page_size: number;
}

export interface InstrumentListParams {
  page?: number;
  page_size?: number;
  lab_id?: string;
  category?: string;
  status?: InstrumentStatus;
  keyword?: string;
}

export interface BookingListParams {
  page?: number;
  page_size?: number;
  instrument_id?: string;
  status?: BookingStatus;
}

export const instrumentsApi = {
  list: (params: InstrumentListParams = {}) =>
    api.get<InstrumentListResponse>("/instruments", { params }).then((r) => r.data),

  get: (id: string) => api.get<Instrument>(`/instruments/${id}`).then((r) => r.data),

  create: (data: InstrumentCreate) =>
    api.post<Instrument>("/instruments", data).then((r) => r.data),

  update: (id: string, data: Partial<InstrumentCreate & { status?: InstrumentStatus }>) =>
    api.patch<Instrument>(`/instruments/${id}`, data).then((r) => r.data),
};

export const instrumentBookingsApi = {
  list: (params: BookingListParams = {}) =>
    api.get<BookingListResponse>("/instrument-bookings", { params }).then((r) => r.data),

  create: (data: InstrumentBookingCreate) =>
    api.post<InstrumentBooking>("/instrument-bookings", data).then((r) => r.data),

  approve: (id: string, comment?: string) =>
    api
      .post<InstrumentBooking>(`/instrument-bookings/${id}/approve`, { comment })
      .then((r) => r.data),

  reject: (id: string, comment: string) =>
    api
      .post<InstrumentBooking>(`/instrument-bookings/${id}/reject`, { comment })
      .then((r) => r.data),
};
