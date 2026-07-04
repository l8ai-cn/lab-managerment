import { api } from "@/shared/api/client";

export type FeeType = "lab_usage" | "consumable";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export const FEE_TYPE_LABELS: Record<FeeType, string> = {
  lab_usage: "实验室使用费",
  consumable: "耗材费",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "待支付",
  paid: "已支付",
  failed: "支付失败",
  refunded: "已退款",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: "orange",
  paid: "green",
  failed: "red",
  refunded: "default",
};

export interface PaymentOrder {
  id: string;
  user_id: string;
  ref_type: string;
  ref_id: string;
  amount: number;
  fee_type: FeeType;
  status: PaymentStatus;
  bank_ref?: string;
  paid_at?: string;
  created_at: string;
}

export interface PaymentOrderListResponse {
  items: PaymentOrder[];
  total: number;
  page: number;
  page_size: number;
}

export interface PaymentOrderCreate {
  ref_type: string;
  ref_id: string;
  amount: number;
  fee_type: FeeType;
}

export const paymentsApi = {
  list: (params: { page?: number; page_size?: number; status?: PaymentStatus } = {}) =>
    api.get<PaymentOrderListResponse>("/payments/orders", { params }).then((r) => r.data),

  create: (data: PaymentOrderCreate) =>
    api.post<PaymentOrder>("/payments/orders", data).then((r) => r.data),

  pay: (id: string) =>
    api.post<{ order_id: string; status: PaymentStatus; message: string }>(
      `/payments/orders/${id}/pay`,
    ).then((r) => r.data),
};
