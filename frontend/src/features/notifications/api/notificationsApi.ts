import { api } from "@/shared/api/client";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
}

export const notificationsApi = {
  list: (params: { unread_only?: boolean; limit?: number } = {}) =>
    api.get<NotificationListResponse>("/notifications", { params }).then((r) => r.data),

  unreadCount: () =>
    api.get<{ count: number }>("/notifications/unread-count").then((r) => r.data),

  markRead: (id: string) => api.post(`/notifications/${id}/read`),
};
